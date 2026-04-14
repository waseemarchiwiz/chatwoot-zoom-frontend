import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  Copy,
} from "lucide-react";

const samplePayload = {
  conversationId: 91,
  source: "zoom-bridge",
  syncedAt: "2026-04-10T10:45:00Z",
  call: {
    id: "zoom-call-8f21a1",
    direction: "inbound",
    status: "completed",
    queueName: "Reception Queue",
    agentName: "Agent 1",
    callerNumber: "+92 300 1234567",
    calleeNumber: "+92 21 1111111",
    customerName: "Muhammad Ali",
    startedAt: "2026-04-10T10:12:18Z",
    endedAt: "2026-04-10T10:18:42Z",
    durationSeconds: 384,
    disposition: "Follow up needed",
  },
  recording: {
    status: "ready",
    url: "https://zoom.example.com/recording/8f21a1",
    downloadUrl: "https://zoom.example.com/recording/8f21a1/download",
    fileType: "mp3",
    fileSizeMb: 12.4,
  },
  ai: {
    summary:
      "Caller asked about appointment confirmation and insurance coverage. Agent verified the profile, confirmed the appointment window, and requested one missing document. A follow-up reminder is needed before tomorrow afternoon.",
    sentiment: "neutral-positive",
    keyTopics: ["appointment", "insurance", "document pending"],
    actionItems: [
      "Send document reminder to customer",
      "Add note for front desk to verify insurance card",
      "Confirm tomorrow appointment slot",
    ],
    riskFlags: ["missing document"],
    nextStepOwner: "Front desk",
  },
  transcript: [
    {
      speaker: "Customer",
      time: "00:05",
      text: "I am calling to confirm my appointment and check whether my insurance has been updated.",
    },
    {
      speaker: "Agent",
      time: "00:19",
      text: "I can help with that. I can see your appointment, but one document is still pending from your side.",
    },
    {
      speaker: "Customer",
      time: "00:36",
      text: "Please send me a reminder. I will upload it today.",
    },
    {
      speaker: "Agent",
      time: "00:52",
      text: "Sure, I will note it down and we will follow up before tomorrow afternoon.",
    },
  ],
};

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function statusTone(status = "") {
  const normalized = status.toLowerCase();
  if (["completed", "ready", "synced"].includes(normalized))
    return "bg-green-100 text-green-800 border-green-200";
  if (["processing", "pending"].includes(normalized))
    return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-slate-100 text-slate-800 border-slate-200";
}

function safeParse(text) {
  try {
    return { data: JSON.parse(text), error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className="text-base font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export default function ZoomBridgeDashboardMock() {
  const [jsonText, setJsonText] = useState(
    JSON.stringify(samplePayload, null, 2),
  );
  const [search, setSearch] = useState("");

  const { data, error } = useMemo(() => safeParse(jsonText), [jsonText]);
  const payload = data || samplePayload;

  const filteredTranscript = useMemo(() => {
    const segments = payload?.transcript || [];
    if (!search.trim()) return segments;
    const q = search.toLowerCase();
    return segments.filter(
      (s) =>
        String(s.speaker || "")
          .toLowerCase()
          .includes(q) ||
        String(s.text || "")
          .toLowerCase()
          .includes(q) ||
        String(s.time || "")
          .toLowerCase()
          .includes(q),
    );
  }, [payload, search]);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    } catch {
      console.log("copied the file..");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-6">
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
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
                      Fast mock dashboard for reviewing call details,
                      recordings, AI summary, and transcript.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="rounded-xl gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </Button>
                    <Button className="rounded-xl gap-2" asChild>
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
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Stat
                    icon={Phone}
                    label="Direction"
                    value={payload?.call?.direction || "—"}
                  />
                  <Stat
                    icon={Clock3}
                    label="Duration"
                    value={formatDuration(payload?.call?.durationSeconds)}
                  />
                  <Stat
                    icon={UserRound}
                    label="Agent"
                    value={payload?.call?.agentName || "—"}
                  />
                  <Stat
                    icon={Brain}
                    label="Sentiment"
                    value={payload?.ai?.sentiment || "—"}
                  />
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-white shadow-sm">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="summary">AI Summary</TabsTrigger>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
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
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="text-slate-500">File type</div>
                          <div className="font-semibold">
                            {payload?.recording?.fileType || "—"}
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="text-slate-500">File size</div>
                          <div className="font-semibold">
                            {payload?.recording?.fileSizeMb
                              ? `${payload.recording.fileSizeMb} MB`
                              : "—"}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-slate-500">Recording link</div>
                        <a
                          href={payload?.recording?.url || "#"}
                          className="flex items-center gap-2 break-all text-blue-600 hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <LinkIcon className="h-4 w-4" />
                          {payload?.recording?.url || "No link"}
                        </a>
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
                        {payload?.ai?.summary || "No summary available."}
                      </p>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <Card className="rounded-2xl shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg">Action items</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {(payload?.ai?.actionItems || []).map(
                            (item, index) => (
                              <div
                                key={index}
                                className="rounded-xl bg-slate-50 p-3 text-sm"
                              >
                                {item}
                              </div>
                            ),
                          )}
                          {!(payload?.ai?.actionItems || []).length && (
                            <div className="text-sm text-slate-500">
                              No action items.
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-2xl shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Topics and flags
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="mb-2 text-sm text-slate-500">
                            Topics
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(payload?.ai?.keyTopics || []).map(
                              (topic, index) => (
                                <Badge key={index} variant="outline">
                                  {topic}
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <div className="mb-2 text-sm text-slate-500">
                            Risk flags
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(payload?.ai?.riskFlags || []).map(
                              (flag, index) => (
                                <Badge
                                  key={index}
                                  className="bg-rose-100 text-rose-800 border border-rose-200"
                                >
                                  {flag}
                                </Badge>
                              ),
                            )}
                            {!(payload?.ai?.riskFlags || []).length && (
                              <span className="text-sm text-slate-500">
                                No risk flags.
                              </span>
                            )}
                          </div>
                        </div>
                        <Separator />
                        <div className="text-sm">
                          <span className="text-slate-500">
                            Next step owner:{" "}
                          </span>
                          <span className="font-medium">
                            {payload?.ai?.nextStepOwner || "—"}
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
                    <CardTitle className="text-lg">Transcript</CardTitle>
                    <div className="relative w-full md:w-80">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search transcript"
                        className="pl-9 rounded-xl"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[420px] pr-4">
                      <div className="space-y-3">
                        {filteredTranscript.map((segment, index) => (
                          <div
                            key={index}
                            className="rounded-2xl border bg-white p-4"
                          >
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <div className="font-semibold text-slate-900">
                                {segment.speaker || "Speaker"}
                              </div>
                              <div className="text-xs text-slate-500">
                                {segment.time || "—"}
                              </div>
                            </div>
                            <p className="text-sm leading-6 text-slate-700">
                              {segment.text || ""}
                            </p>
                          </div>
                        ))}
                        {!filteredTranscript.length && (
                          <div className="text-sm text-slate-500">
                            No matching transcript rows.
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="raw">
                <Card className="rounded-2xl shadow-sm">
                  <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
                    <CardTitle className="text-lg">
                      Paste bridge response JSON
                    </CardTitle>
                    <Button
                      variant="outline"
                      className="rounded-xl gap-2"
                      onClick={copyJson}
                    >
                      <Copy className="h-4 w-4" />
                      Copy current JSON
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      value={jsonText}
                      onChange={(e) => setJsonText(e.target.value)}
                      className="min-h-[420px] rounded-2xl font-mono text-xs"
                    />
                    {error ? (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                        Invalid JSON: {error}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                        JSON parsed successfully.
                      </div>
                    )}
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
                  <span className="text-slate-500">Bridge source</span>
                  <span className="font-medium">{payload?.source || "—"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Sync time</span>
                  <span className="font-medium text-right">
                    {formatDateTime(payload?.syncedAt)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Call ID</span>
                  <span className="font-medium text-right break-all">
                    {payload?.call?.id || "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Recording status</span>
                  <span className="font-medium">
                    {payload?.recording?.status || "—"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  Why this fits the project
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-slate-700">
                <p>
                  This mock keeps Zoom-specific details in a separate panel
                  instead of modifying Chatwoot core heavily.
                </p>
                <p>
                  You can replace the sample JSON with your real bridge response
                  and immediately see how the UI behaves.
                </p>
                <p>
                  Once the layout is approved, wire this view to your live
                  bridge endpoint or Dashboard App integration.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
