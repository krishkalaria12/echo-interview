import { StreamTheme, useCall } from "@stream-io/video-react-sdk";
import { useState } from "react";
import { CallLobby } from "@/modules/call/components/call-lobby";
import { CallActive } from "@/modules/call/components/call-active";
import { CallEnded } from "@/modules/call/components/call-ended";

interface Props {
  interviewName: string;
};

export const CallUI = ({ interviewName }: Props) => {
  const call = useCall();
  const [show, setShow] = useState<"lobby" | "call" | "ended">("lobby");

  const handleJoin = async () => {
    if (!call) return;
    await call.join();
    setShow("call");
  }

  const handleLeave = () => {
    if (!call) return;
    call.endCall();
    setShow("ended");
  }

  return (
    <StreamTheme className="h-full">
      {show === "lobby" && <CallLobby onJoin={handleJoin} />}
      {show === "call" && <CallActive onLeave={handleLeave} interviewName={interviewName} />}
      {show === "ended" && <CallEnded />}
    </StreamTheme>
  )
}