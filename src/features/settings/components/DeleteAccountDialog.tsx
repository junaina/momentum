"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Props = {
  displayName: string;
  username: string | null;
  email: string;
};

export function DeleteAccountDialog({ displayName, username, email }: Props) {
  const router = useRouter();
  const confirmTarget = username?.trim() ? username.trim() : email.trim();
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const canDelete = confirm.trim() === confirmTarget;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          Delete my account permanently
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Account?</AlertDialogTitle>
          <AlertDialogDescription>
            This is irreversible. Don&apos;t say I didn&apos;t warn ya! ভ⤙ ভ To
            confirm, type your {username?.trim() ? "username" : "email"}: {""}
            <span className="font-medium text-foreground">{confirmTarget}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={
              username?.trim() ? "Type your username" : "Type your email"
            }
          >
            {msg ? (
              <p className="text-sm text-muted-foreground">{msg}</p>
            ) : null}
          </Input>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirm("")}>
            Cancel
          </AlertDialogCancel>
          {/* Not wired yet; we’ll connect this to POST /api/auth/delete-account later */}

          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              disabled={!canDelete}
              onClick={() => {
                //placeholder for now so ui is complete
                setMsg(`Delete endpoint not wired yet for ${displayName}.`);
                window.setTimeout(() => setMsg(null), 2500);
                //later after delete succeeds
                //router.replace("/signup");
              }}
            >
              Delete Permanently
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
