"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { evaluatePracticeAnswer } from "@/lib/content";
import { AppLocale, getLocaleCopy } from "@/lib/i18n";
import { LearningType, PracticeQuestion, ProficiencyLevel } from "@/lib/types";
import { pickInteractionType, resolveLearningType } from "@/lib/study-interactions";

type InteractionMode =
  | "tap-assemble"
  | "type-translation"
  | "speech-translation"
  | "tap-match"
  | "fill-in-blank"
  | "listen-select"
  | "listen-transcribe"
  | "speak-repeat"
  | "guided-write"
  | "error-correction";

type SpeechRecognitionResultLike = {
  transcript: string;
};

type SpeechRecognitionEventLike = Event & {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function shuffle<T>(items: T[]) {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function tokenizeAnswer(answer: string) {
  return answer.split(/\s+/).filter(Boolean);
}

function buildDistractors(question: PracticeQuestion, contextWords: string[]) {
  const base = new Set(
    contextWords
      .flatMap((item) => item.split(/\s+/))
      .map((item) => item.trim())
      .filter(Boolean),
  );

  tokenizeAnswer(question.answer).forEach((token) => {
    base.delete(token);
  });

  return [...base].slice(0, 4);
}

function detectSourcePrompt(prompt: string) {
  const match = prompt.match(/[:：]\s*(.+)$/);
  return match?.[1] ?? prompt;
}

export function GeneratedPracticeStep({
  question,
  locale,
  level,
  contextWords
}: {
  question: PracticeQuestion;
  locale: AppLocale;
  level?: ProficiencyLevel;
  contextWords: string[];
}) {
  const copy = getLocaleCopy(locale);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [supportsSpeechRecognition, setSupportsSpeechRecognition] = useState(false);
  const [supportsSpeechPlayback, setSupportsSpeechPlayback] = useState(false);
  const [mode, setMode] = useState<InteractionMode>("type-translation");
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [availableTokens, setAvailableTokens] = useState<string[]>([]);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [spokenAnswer, setSpokenAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [blankAnswer, setBlankAnswer] = useState("");
  const [writingAnswer, setWritingAnswer] = useState("");
  const [listenReady, setListenReady] = useState(false);
  const sourcePrompt = detectSourcePrompt(question.prompt);

  useEffect(() => {
    const SpeechRecognitionApi = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const speechRecognitionAvailable = Boolean(SpeechRecognitionApi);
    const speechPlaybackAvailable = typeof window !== "undefined" && "speechSynthesis" in window;
    setSupportsSpeechRecognition(speechRecognitionAvailable);
    setSupportsSpeechPlayback(speechPlaybackAvailable);

    const nextMode = pickInteractionType({
      learningType: question.learningType,
      level,
      supportsSpeech: speechRecognitionAvailable || speechPlaybackAvailable,
      answerTokenCount: tokenizeAnswer(question.answer).length
    });

    setMode(
      nextMode === "tap-assemble" ||
        nextMode === "speech-translation" ||
        nextMode === "type-translation" ||
        nextMode === "tap-match" ||
        nextMode === "fill-in-blank" ||
        nextMode === "listen-select" ||
        nextMode === "listen-transcribe" ||
        nextMode === "speak-repeat" ||
        nextMode === "guided-write" ||
        nextMode === "error-correction"
        ? nextMode
        : "type-translation",
    );
  }, [level, question.answer, question.learningType]);

  useEffect(() => {
    if (mode !== "tap-assemble") {
      return;
    }

    const answerTokens = tokenizeAnswer(question.answer);
    const distractors = buildDistractors(question, contextWords);
    setSelectedTokens([]);
    setAvailableTokens(shuffle([...answerTokens, ...distractors]));
  }, [contextWords, mode, question]);

  useEffect(() => {
    if (mode !== "tap-match" && mode !== "listen-select") {
      return;
    }

    const generatedOptions = question.meta?.options?.length
      ? question.meta.options
      : shuffle([question.answer, ...buildDistractors(question, contextWords).slice(0, 3)]);
    setSelectedOption("");
    setFeedback(null);
    setAvailableTokens(generatedOptions);
  }, [contextWords, mode, question]);

  useEffect(() => {
    if (mode !== "fill-in-blank" && mode !== "listen-transcribe") {
      return;
    }

    setBlankAnswer("");
    setFeedback(null);
  }, [mode, question]);

  useEffect(() => {
    setTypedAnswer("");
    setSpokenAnswer("");
    setWritingAnswer("");
    setListenReady(false);
  }, [mode, question.id]);

  useEffect(
    () => () => {
      recognitionRef.current?.stop();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    },
    [],
  );

  const assembledAnswer = useMemo(() => selectedTokens.join(" "), [selectedTokens]);
  const currentLearningType = resolveLearningType(question.learningType);

  function currentAnswer() {
    if (mode === "tap-assemble") {
      return assembledAnswer;
    }

    if (mode === "speech-translation" || mode === "speak-repeat") {
      return spokenAnswer;
    }

    if (mode === "tap-match" || mode === "listen-select") {
      return selectedOption;
    }

    if (mode === "fill-in-blank" || mode === "listen-transcribe") {
      return blankAnswer;
    }

    if (mode === "guided-write" || mode === "error-correction") {
      return writingAnswer;
    }

    return typedAnswer;
  }

  function submitAnswer() {
    const result = evaluatePracticeAnswer(currentAnswer(), question.answer, question.acceptableAnswers);
    setFeedback(result.feedback);
    void fetch("/api/practice/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        learningType: currentLearningType as LearningType,
        correct: result.isCorrect
      })
    }).catch(() => {});
  }

  function toggleToken(token: string, source: "available" | "selected", index: number) {
    if (source === "available") {
      setAvailableTokens((prev) => prev.filter((_, tokenIndex) => tokenIndex !== index));
      setSelectedTokens((prev) => [...prev, token]);
      return;
    }

    setSelectedTokens((prev) => prev.filter((_, tokenIndex) => tokenIndex !== index));
    setAvailableTokens((prev) => [...prev, token]);
  }

  function startSpeechCapture() {
    const SpeechRecognitionApi = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionApi) {
      return;
    }

    const recognition = new SpeechRecognitionApi();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();

      setSpokenAnswer(transcript);
      setBlankAnswer(transcript);
    };
    recognition.onerror = () => {
      setIsRecording(false);
    };
    recognition.onend = () => {
      setIsRecording(false);
    };
    recognitionRef.current = recognition;
    setIsRecording(true);
    recognition.start();
  }

  function playPromptAudio() {
    if (!supportsSpeechPlayback) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question.answer);
    utterance.lang = "en-US";
    utterance.rate = currentLearningType === "listening" ? 0.9 : 0.95;
    utterance.onend = () => setListenReady(true);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="study-topic-stack">
      <div className="study-interaction-head">
        <div className="eyebrow">{copy.lesson.practice}</div>
        <span className="pill lesson-meta-pill-secondary">
          {mode === "tap-assemble"
            ? copy.lesson.interactionArrange
            : mode === "tap-match"
              ? copy.lesson.interactionTapMatch
              : mode === "fill-in-blank"
                ? copy.lesson.interactionFillBlank
                : mode === "listen-select"
                  ? copy.lesson.interactionListenSelect
                  : mode === "listen-transcribe"
                  ? copy.lesson.interactionListenTranscribe
                    : mode === "speak-repeat"
                      ? copy.lesson.interactionSpeakRepeat
                      : mode === "guided-write"
                        ? copy.lesson.interactionGuidedWrite
                        : mode === "error-correction"
                          ? copy.lesson.interactionErrorCorrection
                      : mode === "speech-translation"
                        ? copy.lesson.interactionSpeak
                        : copy.lesson.interactionType}
        </span>
      </div>
      <div className="study-topic-type-label">{copy.lesson.learningTypeLabel(currentLearningType)}</div>
      <h2 className="study-topic-title">
        {mode === "listen-select" || mode === "listen-transcribe" ? copy.lesson.listenPromptTitle : sourcePrompt}
      </h2>
      <p className="study-topic-body">
        {mode === "tap-assemble"
          ? copy.lesson.interactionArrangeBody
          : mode === "tap-match"
            ? copy.lesson.interactionTapMatchBody
            : mode === "fill-in-blank"
              ? copy.lesson.interactionFillBlankBody
              : mode === "listen-select"
                ? copy.lesson.interactionListenSelectBody
                : mode === "listen-transcribe"
                ? copy.lesson.interactionListenTranscribeBody
                  : mode === "speak-repeat"
                    ? copy.lesson.interactionSpeakRepeatBody
                    : mode === "guided-write"
                      ? copy.lesson.interactionGuidedWriteBody
                      : mode === "error-correction"
                        ? copy.lesson.interactionErrorCorrectionBody
                    : mode === "speech-translation"
                      ? copy.lesson.interactionSpeakBody
                      : copy.lesson.interactionTypeBody}
      </p>

      {mode === "listen-select" || mode === "listen-transcribe" ? (
        <div className="study-audio-card">
          <div className="eyebrow">{copy.lesson.audioPromptLabel}</div>
          <div className="button-row">
            <button className="button-secondary" disabled={!supportsSpeechPlayback} onClick={playPromptAudio} type="button">
              {copy.lesson.playAudio}
            </button>
          </div>
          {!supportsSpeechPlayback ? <p className="subtle">{copy.lesson.audioUnavailable}</p> : null}
          {supportsSpeechPlayback && !listenReady ? <p className="subtle">{copy.lesson.listenReadyHint}</p> : null}
        </div>
      ) : null}

      {mode === "speak-repeat" ? (
        <div className="study-speech-stack">
          <div className="study-topic-feedback">
            <div className="eyebrow">{copy.lesson.repeatTargetLabel}</div>
            <p className="study-topic-body">{question.answer}</p>
          </div>
          <div className="button-row">
            <button className="button-secondary" disabled={!supportsSpeechPlayback} onClick={playPromptAudio} type="button">
              {copy.lesson.playAudio}
            </button>
            <button
              className="button-secondary"
              disabled={!supportsSpeechRecognition || isRecording}
              onClick={startSpeechCapture}
              type="button"
            >
              {isRecording ? copy.lesson.recording : copy.lesson.startSpeaking}
            </button>
          </div>
          <div className="study-topic-feedback">
            <div className="eyebrow">{copy.lesson.spokenResultLabel}</div>
            <p className="study-topic-body">
              {spokenAnswer ||
                (supportsSpeechRecognition ? copy.lesson.spokenResultEmpty : copy.lesson.speechUnsupported)}
            </p>
          </div>
        </div>
      ) : null}

      {mode === "tap-assemble" ? (
        <div className="study-arrange-layout">
          <div className="study-token-target">
            <div className="eyebrow">{copy.lesson.answerBuildLabel}</div>
            <div className="study-token-row">
              {selectedTokens.length ? (
                selectedTokens.map((token, index) => (
                  <button
                    key={`${token}-${index}-selected`}
                    className="study-token selected"
                    onClick={() => toggleToken(token, "selected", index)}
                    type="button"
                  >
                    {token}
                  </button>
                ))
              ) : (
                <span className="subtle">{copy.lesson.answerBuildEmpty}</span>
              )}
            </div>
          </div>
          <div className="study-token-bank">
            <div className="eyebrow">{copy.lesson.wordBankLabel}</div>
            <div className="study-token-row">
              {availableTokens.map((token, index) => (
                <button
                  key={`${token}-${index}-available`}
                  className="study-token"
                  onClick={() => toggleToken(token, "available", index)}
                  type="button"
                >
                  {token}
                </button>
              ))}
            </div>
          </div>
          <div className="button-row">
            <button
              className="ghost-button"
              onClick={() => {
                const answerTokens = tokenizeAnswer(question.answer);
                const distractors = buildDistractors(question, contextWords);
                setSelectedTokens([]);
                setAvailableTokens(shuffle([...answerTokens, ...distractors]));
                setFeedback(null);
              }}
              type="button"
            >
              {copy.lesson.resetBuild}
            </button>
          </div>
        </div>
      ) : null}

      {mode === "tap-match" || mode === "listen-select" ? (
        <div className="study-choice-grid">
          {availableTokens.map((option, index) => (
            <button
              key={`${option}-${index}`}
              className={`study-choice-card${selectedOption === option ? " active" : ""}`}
              onClick={() => {
                setSelectedOption(option);
                setFeedback(null);
              }}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}

      {mode === "type-translation" ? (
        <textarea
          className="study-topic-textarea"
          value={typedAnswer}
          onChange={(event) => {
            setTypedAnswer(event.target.value);
            setFeedback(null);
          }}
        />
      ) : null}

      {mode === "fill-in-blank" || mode === "listen-transcribe" ? (
        <div className="study-fill-blank-card">
          <div className="eyebrow">
            {mode === "fill-in-blank" ? copy.lesson.fillBlankLabel : copy.lesson.transcribeLabel}
          </div>
          {mode === "fill-in-blank" ? (
            <p className="study-topic-body">{question.meta?.sourceText ?? "____"}</p>
          ) : null}
          <input
            className="study-topic-input"
            value={blankAnswer}
            onChange={(event) => {
              setBlankAnswer(event.target.value);
              setFeedback(null);
            }}
            placeholder={
              mode === "fill-in-blank" ? copy.lesson.fillBlankPlaceholder : copy.lesson.transcribePlaceholder
            }
          />
        </div>
      ) : null}

      {mode === "speech-translation" ? (
        <div className="study-speech-stack">
          <div className="study-topic-feedback">
            <div className="eyebrow">{copy.lesson.spokenResultLabel}</div>
            <p className="study-topic-body">
              {spokenAnswer ||
                (supportsSpeechRecognition ? copy.lesson.spokenResultEmpty : copy.lesson.speechUnsupported)}
            </p>
          </div>
          <div className="button-row">
            <button
              className="button-secondary"
              disabled={!supportsSpeechRecognition || isRecording}
              onClick={startSpeechCapture}
              type="button"
            >
              {isRecording ? copy.lesson.recording : copy.lesson.startSpeaking}
            </button>
            {supportsSpeechRecognition ? (
              <button
                className="ghost-button"
                onClick={() => {
                  recognitionRef.current?.stop();
                  setIsRecording(false);
                }}
                type="button"
              >
                {copy.lesson.stopSpeaking}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {mode === "guided-write" ? (
        <div className="study-writing-card">
          <div className="eyebrow">{copy.lesson.guidedWriteLabel}</div>
          {question.meta?.referenceParts?.length ? (
            <div className="study-token-row">
              {question.meta.referenceParts.map((part) => (
                <span key={part} className="study-token selected">
                  {part}
                </span>
              ))}
            </div>
          ) : null}
          <textarea
            className="study-topic-textarea"
            value={writingAnswer}
            onChange={(event) => {
              setWritingAnswer(event.target.value);
              setFeedback(null);
            }}
            placeholder={copy.lesson.guidedWritePlaceholder}
          />
        </div>
      ) : null}

      {mode === "error-correction" ? (
        <div className="study-writing-card">
          <div className="eyebrow">{copy.lesson.errorCorrectionLabel}</div>
          <div className="study-topic-feedback">
            <p className="study-topic-body">{question.meta?.incorrectText ?? question.prompt}</p>
          </div>
          <textarea
            className="study-topic-textarea"
            value={writingAnswer}
            onChange={(event) => {
              setWritingAnswer(event.target.value);
              setFeedback(null);
            }}
            placeholder={copy.lesson.errorCorrectionPlaceholder}
          />
        </div>
      ) : null}

      <div className="button-row">
        <button className="button-secondary" onClick={submitAnswer} type="button">
          {copy.lesson.checkAnswer}
        </button>
      </div>

      {feedback ? <div className="study-topic-feedback">{feedback}</div> : null}
    </div>
  );
}
