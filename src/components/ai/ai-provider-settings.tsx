"use client";

import { FormEvent, useEffect, useState } from "react";
import { AI_APPLICATION_PERMISSIONS, DEFAULT_AI_SETTINGS, normalizeAiSettings } from "@/lib/ai/settings";
import { AppLocale } from "@/lib/i18n";
import { AIApplicationPermission, AICustomConnectionMode, AISettings } from "@/lib/types";

type ProviderConnection = {
  provider: string;
  mode: string;
  status: string;
  maskedCredential?: string;
  model?: string;
  updatedAt?: string;
};

type ServiceProvider = "openai" | "openrouter" | "google";
type ModelOption = {
  id: string;
  name: string;
};

const apiProviders: ServiceProvider[] = ["openai", "openrouter"];
const oauthProviders: ServiceProvider[] = ["openai", "google"];

function copy(locale: AppLocale) {
  const isZh = locale === "zh-TW";

  return {
    serviceEyebrow: isZh ? "啟用 AI 服務" : "Enable AI service",
    serviceTitleOn: isZh ? "AI 功能已可依權限運作" : "AI features can run by permission",
    serviceTitleOff: isZh ? "AI 功能目前關閉" : "AI features are off",
    serviceBody: isZh
      ? "預設為關閉。開啟後才會顯示應用權限與串接設定，並依照你的選擇啟用 AI 功能。"
      : "Off by default. Permission and connection settings appear only after AI is enabled.",
    offHint: isZh
      ? "目前不會使用 AI 生成、搜尋或優化學習內容。"
      : "AI generation, search, and optimization will not run while this is off.",
    enabled: isZh ? "已啟用" : "Enabled",
    disabled: isZh ? "已關閉" : "Disabled",
    permissionsTitle: isZh ? "AI 應用權限" : "AI application permissions",
    permissionsBody: isZh
      ? "選擇 AI 可以參與的學習流程。未勾選的項目不會自動執行。"
      : "Choose where AI can participate in the learning flow. Unchecked items will not run automatically.",
    permissions: {
      generate_courses: isZh ? "生成課程" : "Generate courses",
      auto_search_courses: isZh ? "自動搜尋課程" : "Auto-search courses",
      course_optimization: isZh ? "課程優化" : "Course optimization",
      learning_optimization: isZh ? "學習優化" : "Learning optimization",
    } satisfies Record<AIApplicationPermission, string>,
    connectionTitle: isZh ? "AI 串接" : "AI connection",
    connectionBody: isZh
      ? "可使用平台服務，或改用自己的服務。使用自己的服務時需提供 API key 或完成 OAuth。"
      : "Use the platform service, or connect your own service. Custom service requires an API key or OAuth.",
    platform: isZh ? "使用平台服務" : "Use platform service",
    platformBody: isZh ? "使用 OpenLearning 平台提供的 AI 額度與模型。" : "Use AI quota and models provided by OpenLearning.",
    custom: isZh ? "使用自己的服務" : "Use my own service",
    customBody: isZh ? "使用你的 API key 或 OAuth 連接，費用由你的服務帳號負擔。" : "Connect with your API key or OAuth. Usage bills your service account.",
    customSetupEyebrow: isZh ? "自己的服務設定" : "Custom service setup",
    methodStep: isZh ? "1. 選擇連接方式" : "1. Choose connection method",
    providerStep: isZh ? "2. 選擇供應商" : "2. Choose provider",
    credentialStep: isZh ? "3. 填寫連接資訊" : "3. Enter connection details",
    apiKeyMode: isZh ? "API key" : "API key",
    apiKeyBody: isZh ? "貼上服務 API key，後端加密保存。" : "Paste a service API key. It is encrypted on the backend.",
    oauthMode: "OAuth",
    oauthBody: isZh ? "暫時停用，之後再開放授權連接。" : "Temporarily disabled. OAuth connection will be enabled later.",
    apiKey: isZh ? "API key" : "API key",
    model: isZh ? "選擇模型" : "Select model",
    modelPlaceholder: isZh ? "搜尋或選擇模型" : "Search or choose a model",
    loadingModels: isZh ? "讀取模型中..." : "Loading models...",
    noModels: isZh ? "尚未取得模型清單" : "No models loaded yet",
    modelCount: isZh ? (count: number) => `${count} 個可用模型` : (count: number) => `${count} available models`,
    refreshModels: isZh ? "更新模型" : "Refresh models",
    modelDisabledHint: isZh ? "請先填入 OpenAI API key，才能更新與選擇模型。" : "Enter an OpenAI API key before refreshing or selecting models.",
    oauthPending: isZh ? "選擇供應商後開始 OAuth 授權，完成後即可使用自己的服務。" : "Choose a provider, then start OAuth authorization to use your own service.",
    connectOauth: isZh ? "開始 OAuth 授權" : "Start OAuth authorization",
    save: isZh ? "儲存設定" : "Save settings",
    saving: isZh ? "儲存中..." : "Saving...",
    test: isZh ? "測試連線" : "Test connection",
    testing: isZh ? "測試中..." : "Testing...",
    remove: isZh ? "移除 API key" : "Remove API key",
    removing: isZh ? "移除中..." : "Removing...",
    connected: isZh ? "API key 已連接" : "API key connected",
    needsAttention: isZh ? "API key 需要檢查" : "API key needs attention",
    notConnected: isZh ? "尚未連接" : "Not connected",
    notConnectedBody: isZh
      ? "貼上 API key、選擇模型後按「儲存設定」，系統會加密保存並用於自己的服務。"
      : "Paste an API key, choose a model, then save settings. The key is encrypted and used for your own service.",
    connectedBody: isZh
      ? "已保存 API key。你可以測試連線，或貼上新的 key 後再次儲存。"
      : "An API key is saved. You can test the connection or paste a new key and save again.",
    saveSuccess: isZh ? "AI 設定已更新。" : "AI settings updated.",
    testSuccess: isZh ? "OpenAI 連線測試成功。" : "OpenAI connection test passed.",
    removeSuccess: isZh ? "API key 已移除。" : "API key removed.",
    apiRequired: isZh ? "使用自己的服務時，請先填寫 API key 或改選 OAuth。" : "Enter an API key or switch to OAuth before using your own service.",
    saveError: isZh ? "AI 設定儲存失敗，請稍後再試。" : "Failed to save AI settings. Please try again later.",
  };
}

export function AiProviderSettings({ locale }: { locale: AppLocale }) {
  const text = copy(locale);
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider>("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [models, setModels] = useState<ModelOption[]>([]);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [modelRefreshCount, setModelRefreshCount] = useState(0);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [connection, setConnection] = useState<ProviderConnection | null>(null);
  const [pending, setPending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/ai/settings").then((response) => response.json()),
      fetch("/api/ai/provider").then((response) => response.json()),
    ])
      .then(([settingsPayload, providerPayload]: [{ settings?: AISettings }, { connection?: ProviderConnection }]) => {
        setSettings(normalizeAiSettings(settingsPayload.settings));
        if (providerPayload.connection?.provider === "openai" || providerPayload.connection?.provider === "openrouter") {
          setSelectedProvider(providerPayload.connection.provider);
        }
        if (providerPayload.connection?.model) {
          setModel(providerPayload.connection.model);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (settings.connectionPreference !== "custom") {
      return;
    }

    fetch(`/api/ai/provider?provider=${encodeURIComponent(selectedProvider)}`)
      .then((response) => response.json())
      .then((payload: { connection?: ProviderConnection }) => {
        setConnection(payload.connection ?? null);
        if (payload.connection?.model) {
          setModel(payload.connection.model);
        } else {
          setModel("");
        }
      })
      .catch(() => undefined);
  }, [selectedProvider, settings.connectionPreference]);

  useEffect(() => {
    if (settings.connectionPreference !== "custom" || settings.customConnectionMode !== "api") {
      return;
    }

    if (selectedProvider === "openai" && !apiKey.trim() && !connection) {
      setModels([]);
      setModelsError(null);
      return;
    }

    const controller = new AbortController();
    setModelsLoading(true);
    setModelsError(null);

    fetch("/api/ai/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: selectedProvider, apiKey: apiKey.trim() || undefined }),
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((payload: { ok: boolean; error?: string; models?: ModelOption[] }) => {
        if (!payload.ok) {
          setModels([]);
          setModelsError(payload.error ?? text.noModels);
          return;
        }

        setModels(payload.models ?? []);
      })
      .catch((fetchError) => {
        if ((fetchError as Error).name !== "AbortError") {
          setModels([]);
          setModelsError(text.noModels);
        }
      })
      .finally(() => setModelsLoading(false));

    return () => controller.abort();
  }, [apiKey, connection, modelRefreshCount, selectedProvider, settings.connectionPreference, settings.customConnectionMode, text.noModels]);

  function updatePermission(permission: AIApplicationPermission, enabled: boolean) {
    setSettings((current) => ({
      ...current,
      permissions: {
        ...current.permissions,
        [permission]: enabled,
      },
    }));
  }

  function updateCustomConnectionMode(mode: AICustomConnectionMode) {
    setSettings((current) => ({
      ...current,
      customConnectionMode: mode,
    }));
    setSelectedProvider(mode === "api" ? "openai" : "google");
  }

  async function saveApiKeyIfNeeded() {
    if (!settings.enabled) {
      return true;
    }

    if (settings.connectionPreference !== "custom" || settings.customConnectionMode !== "api") {
      return true;
    }

    if (!apiKey.trim()) {
      if (connection) {
        return true;
      }

      setError(text.apiRequired);
      return false;
    }

    const response = await fetch("/api/ai/provider", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: selectedProvider, apiKey, model }),
    });
    const payload = (await response.json()) as { ok: boolean; error?: string; connection?: ProviderConnection };

    if (!payload.ok || !payload.connection) {
      setError(payload.error ?? text.saveError);
      return false;
    }

    setConnection(payload.connection);
    setApiKey("");
    return true;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setStatus(null);

    const apiSaved = await saveApiKeyIfNeeded();

    if (!apiSaved) {
      setPending(false);
      return;
    }

    const response = await fetch("/api/ai/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const payload = (await response.json()) as { ok: boolean; error?: string; settings?: AISettings };
    setPending(false);

    if (!payload.ok || !payload.settings) {
      setError(payload.error ?? text.saveError);
      return;
    }

    setSettings(normalizeAiSettings(payload.settings));
    setStatus(text.saveSuccess);
  }

  async function testConnection() {
    setTesting(true);
    setError(null);
    setStatus(null);

    const response = await fetch(`/api/ai/provider?provider=${encodeURIComponent(selectedProvider)}`, { method: "PATCH" });
    const payload = (await response.json()) as { ok: boolean; error?: string; connection?: ProviderConnection };
    setTesting(false);

    if (payload.connection) {
      setConnection(payload.connection);
    }

    if (!payload.ok) {
      setError(payload.error ?? "Connection test failed.");
      return;
    }

    setStatus(text.testSuccess);
  }

  async function removeConnection() {
    setRemoving(true);
    setError(null);
    setStatus(null);

    const response = await fetch(`/api/ai/provider?provider=${encodeURIComponent(selectedProvider)}`, { method: "DELETE" });
    const payload = (await response.json()) as { ok: boolean; error?: string };
    setRemoving(false);

    if (!payload.ok) {
      setError(payload.error ?? "Failed to remove provider connection.");
      return;
    }

    setConnection(null);
    setStatus(text.removeSuccess);
  }

  const connectionLabel = connection?.status === "needs_attention"
    ? text.needsAttention
    : connection
      ? text.connected
      : text.notConnected;
  const serviceTitle = settings.enabled ? text.serviceTitleOn : text.serviceTitleOff;
  const visibleProviders = settings.customConnectionMode === "api" ? apiProviders : oauthProviders;
  const filteredModels = models
    .filter((option) => `${option.id} ${option.name}`.toLowerCase().includes(model.toLowerCase()))
    .slice(0, 24);
  const apiKeyPlaceholder = selectedProvider === "openrouter" ? "sk-or-v1-..." : "sk-proj-...";
  const connectionBody = connection ? text.connectedBody : text.notConnectedBody;
  const modelSelectionDisabled = selectedProvider === "openai" && !apiKey.trim() && !connection;
  const modelHelpText = modelSelectionDisabled
    ? text.modelDisabledHint
    : modelsError ?? (modelsLoading ? text.loadingModels : text.modelCount(models.length));

  return (
    <form className="stack ai-settings-form" onSubmit={onSubmit}>
      <section className="review-card stack">
        <div className="stack">
          <div className="ai-settings-topline">
            <div className="eyebrow">{text.serviceEyebrow}</div>
            <span className={`settings-status-pill${settings.enabled ? " active" : ""}`}>
              {settings.enabled ? text.enabled : text.disabled}
            </span>
          </div>
          <h2 className="section-title">{serviceTitle}</h2>
          <p className="subtle">{text.serviceBody}</p>
        </div>
        <label className="check-row ai-settings-toggle">
          <input
            checked={settings.enabled}
            onChange={(event) => setSettings((current) => ({ ...current, enabled: event.target.checked }))}
            type="checkbox"
          />
          <span>{settings.enabled ? text.enabled : text.disabled}</span>
        </label>
        {!settings.enabled ? (
          <div className="muted-box ai-settings-off-box">
            <p className="subtle">{text.offHint}</p>
          </div>
        ) : null}
      </section>

      {settings.enabled ? (
        <>
          <section className="review-card stack">
            <div className="stack">
              <div className="eyebrow">{text.permissionsTitle}</div>
              <p className="subtle">{text.permissionsBody}</p>
            </div>
            <div className="settings-option-grid">
              {AI_APPLICATION_PERMISSIONS.map((permission) => (
                <label className={`settings-option ai-permission-option${settings.permissions[permission] ? " active" : ""}`} key={permission}>
                  <span className="check-row">
                    <input
                      checked={settings.permissions[permission]}
                      onChange={(event) => updatePermission(permission, event.target.checked)}
                      type="checkbox"
                    />
                    <strong>{text.permissions[permission]}</strong>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="review-card stack">
            <div className="stack">
              <div className="eyebrow">{text.connectionTitle}</div>
              <p className="subtle">{text.connectionBody}</p>
            </div>

            <div className="choice-grid settings-choice-grid" role="radiogroup" aria-label={text.connectionTitle}>
              <button
                aria-checked={settings.connectionPreference === "platform"}
                className={`choice-card settings-choice-card${settings.connectionPreference === "platform" ? " active" : ""}`}
                onClick={() => setSettings((current) => ({ ...current, connectionPreference: "platform" }))}
                role="radio"
                type="button"
              >
                <span className="choice-card-copy">
                  <span className="choice-card-title">{text.platform}</span>
                  <span className="choice-card-description">{text.platformBody}</span>
                </span>
              </button>
              <button
                aria-checked={settings.connectionPreference === "custom"}
                className={`choice-card settings-choice-card${settings.connectionPreference === "custom" ? " active" : ""}`}
                onClick={() => setSettings((current) => ({ ...current, connectionPreference: "custom" }))}
                role="radio"
                type="button"
              >
                <span className="choice-card-copy">
                  <span className="choice-card-title">{text.custom}</span>
                  <span className="choice-card-description">{text.customBody}</span>
                </span>
              </button>
            </div>

            {settings.connectionPreference === "custom" ? (
              <div className="stack ai-custom-connection-panel">
                <div className="eyebrow">{text.customSetupEyebrow}</div>

                <div className="ai-custom-step stack">
                  <div className="ai-custom-step-header">
                    <strong>{text.methodStep}</strong>
                  </div>
                  <div className="choice-grid ai-mode-choice-grid" role="radiogroup" aria-label={text.methodStep}>
                    <button
                      aria-checked={settings.customConnectionMode === "api"}
                      className={`choice-card ai-mode-choice-card${settings.customConnectionMode === "api" ? " active" : ""}`}
                      onClick={() => updateCustomConnectionMode("api")}
                      role="radio"
                      type="button"
                    >
                      <span className="choice-card-copy">
                        <span className="choice-card-title">{text.apiKeyMode}</span>
                        <span className="choice-card-description">{text.apiKeyBody}</span>
                      </span>
                    </button>
                    <button
                      aria-checked={settings.customConnectionMode === "oauth"}
                      className={`choice-card ai-mode-choice-card${settings.customConnectionMode === "oauth" ? " active" : ""}`}
                      disabled
                      onClick={() => undefined}
                      role="radio"
                      type="button"
                    >
                      <span className="choice-card-copy">
                        <span className="choice-card-title">{text.oauthMode}</span>
                        <span className="choice-card-description">{text.oauthBody}</span>
                      </span>
                    </button>
                  </div>
                </div>

                  <div className="ai-custom-step stack">
                    <div className="ai-custom-step-header">
                      <strong>{text.providerStep}</strong>
                    </div>
                  <div className="choice-grid ai-provider-choice-grid" role="radiogroup" aria-label={text.providerStep}>
                    {visibleProviders.map((provider) => {
                      return (
                        <button
                          aria-checked={selectedProvider === provider}
                          className={`choice-card ai-provider-choice-card${selectedProvider === provider ? " active" : ""}`}
                          key={provider}
                          onClick={() => setSelectedProvider(provider)}
                          role="radio"
                          type="button"
                        >
                          <span className="choice-card-copy">
                            <span className="choice-card-title">
                              {provider === "openai" ? "OpenAI" : provider === "openrouter" ? "OpenRouter" : "Google Gemini"}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {settings.customConnectionMode === "api" ? (
                  <div className="ai-custom-step stack">
                    <div className="ai-custom-step-header">
                      <strong>{text.credentialStep}</strong>
                    </div>
                    <div className={`ai-connection-notice${connection ? " connected" : ""}`}>
                      <div>
                        <strong>{connectionLabel}</strong>
                        <p className="subtle">{connectionBody}</p>
                      </div>
                      {connection?.maskedCredential ? <span className="settings-status-pill active">{connection.maskedCredential}</span> : null}
                    </div>
                    <label className="field">
                      {selectedProvider === "openrouter" ? "OpenRouter API key" : "OpenAI API key"}
                      <input
                        autoComplete="off"
                        value={apiKey}
                        onChange={(event) => setApiKey(event.target.value)}
                        placeholder={apiKeyPlaceholder}
                        type="password"
                      />
                    </label>
                    <div className="field ai-model-field">
                      <div className="ai-field-heading">
                        <span>{text.model}</span>
                        <button
                          className="ghost-button ai-inline-action"
                          disabled={modelSelectionDisabled || modelsLoading}
                          onClick={() => setModelRefreshCount((current) => current + 1)}
                          type="button"
                        >
                          {text.refreshModels}
                        </button>
                      </div>
                      <input
                        autoComplete="off"
                        disabled={modelSelectionDisabled}
                        onBlur={() => window.setTimeout(() => setModelMenuOpen(false), 120)}
                        onChange={(event) => setModel(event.target.value)}
                        onFocus={() => setModelMenuOpen(true)}
                        placeholder={modelsLoading ? text.loadingModels : text.modelPlaceholder}
                        value={model}
                      />
                      {modelMenuOpen ? (
                        <div className="ai-model-menu">
                          {filteredModels.length > 0 ? (
                            filteredModels.map((option) => (
                              <button
                                className="ai-model-option"
                                key={option.id}
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  setModel(option.id);
                                  setModelMenuOpen(false);
                                }}
                                type="button"
                              >
                                <strong>{option.id}</strong>
                                {option.name !== option.id ? <span>{option.name}</span> : null}
                              </button>
                            ))
                          ) : (
                            <div className="ai-model-empty">{modelsLoading ? text.loadingModels : modelsError ?? text.noModels}</div>
                          )}
                        </div>
                      ) : null}
                      <span className="subtle">{modelHelpText}</span>
                    </div>
                    <div className="button-row">
                      <button className="button-secondary" disabled={!connection || testing || removing} onClick={testConnection} type="button">
                        {testing ? text.testing : text.test}
                      </button>
                      <button className="ghost-button" disabled={!connection || removing || testing} onClick={removeConnection} type="button">
                        {removing ? text.removing : text.remove}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="ai-custom-step stack">
                    <div className="ai-custom-step-header">
                      <strong>{text.credentialStep}</strong>
                    </div>
                    <div className="muted-box">
                      <p className="subtle">{text.oauthPending}</p>
                    </div>
                    <a aria-disabled="true" className="button-secondary disabled-link" href="#" onClick={(event) => event.preventDefault()}>
                      {text.connectOauth}
                    </a>
                  </div>
                )}
              </div>
            ) : null}
          </section>
        </>
      ) : null}

      {error ? <div className="toast-inline error">{error}</div> : null}
      {status ? <div className="toast-inline success">{status}</div> : null}

      <div className="button-row settings-actions">
        <button className="button" disabled={pending || testing || removing} type="submit">
          {pending ? text.saving : text.save}
        </button>
      </div>
    </form>
  );
}
