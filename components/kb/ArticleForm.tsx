"use client";

import { useActionState } from "react";
import { createArticle, updateArticle, type FormState } from "@/app/(portal)/kb/actions";
import type { KbArticle } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = ["policy", "sop", "guide", "template", "faq"];

export function ArticleForm({ article }: { article?: KbArticle }) {
  const action = article ? updateArticle.bind(null, article.id) : createArticle;
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" name="title" required defaultValue={article?.title ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select name="category" defaultValue={article?.category ?? undefined} required>
          <SelectTrigger id="category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input id="tags" name="tags" defaultValue={article?.tags?.join(", ") ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Body (Markdown) *</Label>
        <Textarea id="body" name="body" rows={16} required defaultValue={article?.body ?? ""} className="font-mono text-sm" />
      </div>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : article ? "Save changes" : "Publish article"}
      </Button>
    </form>
  );
}
