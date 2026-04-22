import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Phone,
  Clock3,
  FileAudio,
  Brain,
  UserRound,
  Link as LinkIcon,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Search,
} from "lucide-react";
import { BRIDGE_BASE_URL } from "@/config";

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatDuration(seconds, fallback = "—") {
  if (seconds === null || seconds === undefined || seconds === "") {
    return fallback;
  }
  const s = Number(seconds);
  if (Number.isNaN(s)) return fallback;
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function statusTone(status = "") {
  const normalized = String(status || "").toLowerCase();

  if (["completed", "answered", "ready", "synced"].includes(normalized)) {
    return "bg-green-100 text-green-800 border-green-200";
  }

  if (["processing", "pending", "in_progress"].includes(normalized)) {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }

  if (["missed", "failed", "voicemail"].includes(normalized)) {
    return "bg-rose-100 text-rose-800 border-rose-200";
  }

  return "bg-slate-100 text-slate-800 border-slate-200";
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className="text-base font-semibold text-slate-900">
        {value || "—"}
      </div>
    </div>
  );
}

function EmptyState({ title, message }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="py-14 text-center">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
      </CardContent>
    </Card>
  );
}

function parseEventData(data) {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
  return data;
}

function normalizeCall(call, bridgePayload) {
  const transcriptSegments = [];

  if (call?.voicemail?.transcript) {
    transcriptSegments.push({
      speaker: "Voicemail transcript",
      time: "",
      text: call.voicemail.transcript,
    });
  }

  if (Array.isArray(call?.routePath)) {
    call.routePath.forEach((step, index) => {
      transcriptSegments.push({
        speaker:
          step.operatorName ||
          step.calleeName ||
          step.event ||
          `Step ${index + 1}`,
        time: step.startTime || step.answerTime || step.endTime || "",
        text: [
          step.event || "route",
          step.result || "",
          step.operatorName ? `operator: ${step.operatorName}` : "",
          step.calleeExtType ? `target type: ${step.calleeExtType}` : "",
          step.waitTime ? `wait: ${step.waitTime}s` : "",
          step.talkTime ? `talk: ${step.talkTime}s` : "",
        ]
          .filter(Boolean)
          .join(" · "),
      });
    });
  }

  return {
    conversationId: bridgePayload?.conversationId,
    source: "zoom-bridge",
    syncedAt: call?.endedAt || call?.startedAt || "",
    call: {
      id: call?.zoomCallId || "—",
      direction: call?.direction || "—",
      status: call?.status || "unknown",
      queueName: call?.queue?.name || "—",
      queueExtension: call?.queue?.extension || "",
      agentName:
        call?.answeredBy?.name ||
        call?.caller?.name ||
        call?.callee?.name ||
        "—",
      callerNumber: call?.caller?.number || "—",
      calleeNumber: call?.callee?.number || "—",
      customerName: call?.caller?.name || call?.callee?.name || "—",
      startedAt: call?.startedAt || "",
      endedAt: call?.endedAt || "",
      durationSeconds: call?.durationSeconds ?? null,
      disposition: call?.handupResult || "—",
      waitSeconds: call?.waitSeconds ?? null,
      autoReceptionistName: call?.autoReceptionist?.name || "",
      autoReceptionistExtension: call?.autoReceptionist?.extension || "",
    },
    recording: {
      status: call?.recording?.available ? "ready" : "not available",
      url: call?.recording?.url || "",
      fileType: call?.recording?.available ? "audio" : "",
      fileSizeMb: null,
    },
    ai: {
      summary: call?.aiSummary?.text || "",
      sentiment: "—",
      keyTopics: [],
      actionItems: [],
      riskFlags: [],
      nextStepOwner: call?.queue?.name || "—",
    },
    transcript: transcriptSegments,
    raw: bridgePayload,
  };
}

export default function ZoomConversationPanel() {
  const [conversationId, setConversationId] = useState(null);
  const [bridgeData, setBridgeData] = useState(null);
  const [selectedCallIndex, setSelectedCallIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchZoomConversation = async (id, refresh = false) => {
    if (!id) return;

    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const res = await fetch(
        `${BRIDGE_BASE_URL}/api/zoom/conversation/${id}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!res.ok) {
        throw new Error(`Bridge request failed with ${res.status}`);
      }

      const data = await res.json();
      console.log("i am data:---", data);

      setBridgeData(data);
      setSelectedCallIndex(0);
    } catch (err) {
      setError(err?.message || "Failed to load Zoom data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const handleMessage = (event) => {
      const incoming = parseEventData(event.data);

      if (!incoming || incoming.event !== "appContext") return;

      const id = incoming?.data?.conversation?.id || incoming?.data?.id || null;

      if (!id) return;

      setConversationId(id);
      fetchZoomConversation(id);
    };

    window.addEventListener("message", handleMessage);
    window.parent?.postMessage("chatwoot-dashboard-app:fetch-info", "*");

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const selectedCall = bridgeData?.calls?.[selectedCallIndex] || null;

  const payload = useMemo(() => {
    if (!selectedCall || !bridgeData) return null;
    return normalizeCall(selectedCall, bridgeData);
  }, [selectedCall, bridgeData]);

  const filteredTranscript = useMemo(() => {
    const segments = payload?.transcript || [];
    if (!search.trim()) return segments;

    const q = search.toLowerCase();
    return segments.filter(
      (segment) =>
        String(segment.speaker || "")
          .toLowerCase()
          .includes(q) ||
        String(segment.text || "")
          .toLowerCase()
          .includes(q) ||
        String(segment.time || "")
          .toLowerCase()
          .includes(q),
    );
  }, [payload, search]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <EmptyState
          title="Loading Zoom data"
          message="Waiting for Chatwoot conversation context and bridge response."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <EmptyState title="Zoom panel error" message={error} />
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <EmptyState
          title="No conversation selected"
          message="Open a Chatwoot conversation first so this tab can load the matching Zoom call."
        />
      </div>
    );
  }

  if (!bridgeData?.hasMatch || !bridgeData?.calls?.length) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <EmptyState
          title="No Zoom call found"
          message={`No Zoom call is linked to Chatwoot conversation #${conversationId} yet.`}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-6">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge
                        className={`${statusTone(payload?.call?.status)} border`}
                      >
                        {payload?.call?.status || "Unknown"}
                      </Badge>
                      <Badge variant="outline">
                        Conversation #{payload?.conversationId || "—"}
                      </Badge>
                      <Badge variant="outline">
                        {payload?.source || "zoom-bridge"}
                      </Badge>
                    </div>

                    <CardTitle className="text-2xl">
                      Zoom Call Workspace
                    </CardTitle>

                    <p className="mt-2 text-sm text-slate-500">
                      Live conversation-scoped Zoom data for the selected
                      Chatwoot thread.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="rounded-xl gap-2"
                      onClick={() =>
                        fetchZoomConversation(conversationId, true)
                      }
                      disabled={refreshing}
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                      />
                      Refresh
                    </Button>

                    <Button
                      className="rounded-xl gap-2"
                      asChild
                      disabled={!payload?.recording?.url}
                    >
                      <a
                        href={payload?.recording?.url || "#"}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <FileAudio className="h-4 w-4" />
                        Open Recording
                      </a>
                    </Button>
                  </div>
                </div>

                {bridgeData?.calls?.length > 1 && (
                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-slate-600">
                      Select call
                    </label>
                    <select
                      className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
                      value={selectedCallIndex}
                      onChange={(e) =>
                        setSelectedCallIndex(Number(e.target.value))
                      }
                    >
                      {bridgeData.calls.map((call, index) => (
                        <option key={call.zoomCallId || index} value={index}>
                          {call.zoomCallId || `Call ${index + 1}`} ·{" "}
                          {formatDateTime(call.endedAt || call.startedAt)} ·{" "}
                          {call.direction || "—"} · {call.status || "—"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </CardHeader>

              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Stat
                    icon={Phone}
                    label="Direction"
                    value={payload?.call?.direction}
                  />
                  <Stat
                    icon={Clock3}
                    label="Duration"
                    value={formatDuration(payload?.call?.durationSeconds)}
                  />
                  <Stat
                    icon={UserRound}
                    label="Agent"
                    value={payload?.call?.agentName}
                  />
                  <Stat
                    icon={Brain}
                    label="Wait"
                    value={formatDuration(payload?.call?.waitSeconds)}
                  />
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-white shadow-sm">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="summary">AI / Notes</TabsTrigger>
                <TabsTrigger value="transcript">Transcript / Route</TabsTrigger>
                <TabsTrigger value="raw">Raw JSON</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="rounded-2xl shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Call details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Customer</span>
                        <span className="font-medium text-right">
                          {payload?.call?.customerName || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Caller</span>
                        <span className="font-medium text-right">
                          {payload?.call?.callerNumber || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Callee</span>
                        <span className="font-medium text-right">
                          {payload?.call?.calleeNumber || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Queue</span>
                        <span className="font-medium text-right">
                          {payload?.call?.queueName || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Started</span>
                        <span className="font-medium text-right">
                          {formatDateTime(payload?.call?.startedAt)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Ended</span>
                        <span className="font-medium text-right">
                          {formatDateTime(payload?.call?.endedAt)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Disposition</span>
                        <span className="font-medium text-right">
                          {payload?.call?.disposition || "—"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">Recording</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <div className="flex items-center gap-2">
                        {payload?.recording?.status === "ready" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                        )}
                        <span className="font-medium">
                          {payload?.recording?.status || "unknown"}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="text-slate-500">Recording link</div>
                        {payload?.recording?.url ? (
                          <a
                            href={payload.recording.url}
                            className="flex items-center gap-2 break-all text-blue-600 hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            <LinkIcon className="h-4 w-4" />
                            {payload.recording.url}
                          </a>
                        ) : (
                          <div className="text-slate-500">
                            No recording available yet
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="summary">
                <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                  <Card className="rounded-2xl shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">AI summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="leading-7 text-slate-700">
                        {payload?.ai?.summary || "No AI summary available yet."}
                      </p>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <Card className="rounded-2xl shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg">Action items</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-slate-500">
                          No structured action items are coming from the bridge
                          yet.
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg">Routing</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-sm">
                          <span className="text-slate-500">Queue: </span>
                          <span className="font-medium">
                            {selectedCall?.queue?.name || "—"}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-slate-500">
                            Auto receptionist:{" "}
                          </span>
                          <span className="font-medium">
                            {selectedCall?.autoReceptionist?.name || "—"}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-slate-500">Answered by: </span>
                          <span className="font-medium">
                            {selectedCall?.answeredBy?.name || "—"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="transcript">
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
                    <CardTitle className="text-lg">
                      Transcript / Route
                    </CardTitle>
                    <div className="relative w-full md:w-80">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search"
                        className="pl-9 rounded-xl"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[420px] pr-4">
                      <div className="space-y-3">
                        {filteredTranscript.length ? (
                          filteredTranscript.map((segment, index) => (
                            <div
                              key={index}
                              className="rounded-2xl border bg-white p-4"
                            >
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <div className="font-semibold text-slate-900">
                                  {segment.speaker || "Speaker"}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {formatDateTime(segment.time)}
                                </div>
                              </div>
                              <p className="text-sm leading-6 text-slate-700">
                                {segment.text || ""}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-slate-500">
                            No transcript or routing detail available yet.
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="raw">
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Raw bridge response
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="max-h-[520px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
                      {JSON.stringify(bridgeData, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Sync status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Conversation</span>
                  <span className="font-medium">{conversationId}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Match type</span>
                  <span className="font-medium">
                    {bridgeData?.matchType || "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Call ID</span>
                  <span className="font-medium text-right break-all">
                    {selectedCall?.zoomCallId || "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Recording status</span>
                  <span className="font-medium">
                    {selectedCall?.recording?.available
                      ? "ready"
                      : "not available"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Bridge notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-slate-700">
                <p>
                  This panel is live against the Zoom bridge and scoped to the
                  currently selected Chatwoot conversation.
                </p>
                <p>
                  Test first with mapped conversations like <b>2457</b> and{" "}
                  <b>2458</b>.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
