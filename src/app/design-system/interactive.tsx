"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";

export function InteractiveDemos() {
  return (
    <div className="flex flex-wrap gap-3">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary">Open modal</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Modal title</DialogTitle>
          <DialogDescription>Modals trap focus, close on Escape and restore focus to the trigger.</DialogDescription>
          <DialogFooter>
            <DialogClose asChild>
              <Button>Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        destructive
        title="Delete this draft?"
        description="The draft and its lessons will be removed. This can’t be undone."
        confirmLabel="Delete draft"
        onConfirm={async () => {
          await new Promise((r) => setTimeout(r, 600));
          toast.success("Draft deleted", { description: "Demo only — nothing was stored." });
        }}
        trigger={
          <Button variant="danger">
            <Trash2 /> Delete draft
          </Button>
        }
      />
      <Button variant="secondary" onClick={() => toast.success("Changes saved")}>
        Success toast
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast.error("Couldn’t save changes", { description: "Check your connection and try again." })}
      >
        Error toast
      </Button>
    </div>
  );
}
