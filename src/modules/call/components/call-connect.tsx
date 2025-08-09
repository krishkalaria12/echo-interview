import { useEffect, useState } from "react";
import { LoaderIcon } from "lucide-react";
import {
    Call,
    CallingState,
    StreamCall,
    StreamVideo,
    StreamVideoClient
} from "@stream-io/video-react-sdk";
import { useMutation } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { CallUI } from "@/modules/call/components/call-ui";

import "@stream-io/video-react-sdk/dist/css/styles.css";

interface Props {
  interviewId: string;
  interviewName: string;
  userId: string;
  userName: string;
  userImage: string;
}

export const CallConnect = ({
  interviewId,
  interviewName,
  userId,
  userName,
  userImage,
}: Props) => {
    const trpc = useTRPC();
    const { mutateAsync: generateToken } = useMutation(
        trpc.interviews.generateToken.mutationOptions()
    )

    const [client, setClient] = useState<StreamVideoClient>();

    useEffect(() => {
        const _client = new StreamVideoClient({
            apiKey: process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!,
            user: {
              id: userId,
              name: userName,
              image: userImage,
            },
            tokenProvider: generateToken,
        });
          
        setClient(_client);
          
        return () => {
            _client.disconnectUser();
            setClient(undefined);
        }
    }, [userId, userName, userImage, generateToken]);

    const [call, setCall] = useState<Call>();
    
    useEffect(() => {
        if (!client) return;

        const _call = client.call("default", interviewId);
        _call.camera.disable();
        _call.microphone.disable();
        setCall(_call);

        return () => {
            if (_call.state.callingState !== CallingState.LEFT) {
                _call.leave();
                _call.endCall();
                setCall(undefined);
            }
        };
    }, [client, interviewId]);

    if (!client || !call) {
        return (
            <div className="flex h-screen items-center justify-center bg-radial from-sidebar-accent to-sidebar">
                <LoaderIcon className="size-6 animate-spin text-white" />
            </div>
        )
    }

    return (
        <StreamVideo client={client}>
            <StreamCall call={call}>
                <CallUI interviewName={interviewName} />
            </StreamCall>
        </StreamVideo>
    );
};
