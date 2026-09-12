"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoastLoading } from "@/components/RoastLoading";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardEyebrow } from "@/components/ui/card";
import { track } from "@/lib/analytics/client";
import {
  ROAST_CATEGORIES,
  ROAST_CATEGORY_LABELS,
  ROAST_LEVELS,
  ROAST_LEVEL_LABELS,
  SUBJECT_TYPES,
  SUBJECT_TYPE_LABELS,
  type RoastCategory,
  type RoastLevel,
  type SubjectType,
} from "@/lib/ai/schema";
import { MAX_IMAGES } from "@/lib/storage/types";
import { cn } from "@/lib/utils";

type UploadedImage = { url: string; pathname: string };

const STEP_TITLES = [
  "First, who are we roasting?",
  "Give us some ammunition.",
  "Pick your roast level.",
] as const;

const slide = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 48 : -48 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -48 : 48 }),
};

export function RoastInput({ referredBy }: { referredBy?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const [subjectType, setSubjectType] = useState<SubjectType>("myself");
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [aboutText, setAboutText] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [roastLevel, setRoastLevel] = useState<RoastLevel>("savage");
  const [categories, setCategories] = useState<RoastCategory[]>(["full_life"]);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const ammunitionChars = `${pastedText} ${aboutText}`.trim().length;
  const hasAmmunition = ammunitionChars >= 40 || images.length > 0;

  const go = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setError(null);
    setStep(next);
  };

  const toggleCategory = (key: RoastCategory) => {
    setCategories((current) =>
      current.includes(key)
        ? current.filter((c) => c !== key).length === 0
          ? current
          : current.filter((c) => c !== key)
        : [...current, key],
    );
  };

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList).slice(0, MAX_IMAGES - images.length);
      if (files.length === 0) {
        setError(`You can attach at most ${MAX_IMAGES} screenshots.`);
        return;
      }

      setUploading(true);
      setError(null);
      const form = new FormData();
      files.forEach((file) => form.append("files", file));

      try {
        const response = await fetch("/api/upload", { method: "POST", body: form });
        const data = await response.json();
        if (!response.ok) {
          setError(data?.error?.detail ?? data?.error?.message ?? "That upload didn't stick.");
          return;
        }
        setImages((current) => [...current, ...data.files]);
        track("image_uploaded", { count: data.files.length });
      } catch {
        setError("Upload failed. Check your connection and try again.");
      } finally {
        setUploading(false);
        if (fileInput.current) fileInput.current.value = "";
      }
    },
    [images.length],
  );

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectType,
          pastedText,
          aboutText,
          imageUrls: images.map((i) => i.url),
          roastLevel,
          categories,
          consentConfirmed,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error?.detail ?? data?.error?.message ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }
      track("roast_generated", { referred: Boolean(referredBy) }, data.roast.id);
      router.push(`/roast/${data.roast.id}`);
    } catch {
      setError("Network hiccup. Your roast is still safe. Try again.");
      setSubmitting(false);
    }
  };

  // While the single AI request is in flight we take over the whole viewport
  // with the animated loading experience rather than a button spinner.
  if (submitting) return <RoastLoading />;

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-10 sm:pt-16">
      <Progress step={step} />

      <div className="mt-8 flex items-center gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => go(step - 1)}
            className="inline-flex size-9 items-center justify-center rounded-full border border-edge text-muted transition-colors hover:border-flame/50 hover:text-chalk"
            aria-label="Go back"
          >
            <ArrowLeft className="size-4" />
          </button>
        ) : null}
        <h1 className="font-display text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          {STEP_TITLES[step]}
        </h1>
      </div>

      <div className="relative mt-8 min-h-[22rem]">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 0 ? (
              <StepSubject
                subjectType={subjectType}
                onSelect={(value) => {
                  setSubjectType(value);
                  if (value === "myself") setConsentConfirmed(false);
                }}
                consentConfirmed={consentConfirmed}
                onConsentChange={setConsentConfirmed}
              />
            ) : null}

            {step === 1 ? (
              <StepAmmunition
                pastedText={pastedText}
                setPastedText={setPastedText}
                aboutText={aboutText}
                setAboutText={setAboutText}
                images={images}
                onRemoveImage={(url) => setImages((c) => c.filter((i) => i.url !== url))}
                uploading={uploading}
                onPickFiles={() => fileInput.current?.click()}
                fileInput={fileInput}
                onFiles={handleFiles}
                ammunitionChars={ammunitionChars}
              />
            ) : null}

            {step === 2 ? (
              <StepLevel
                roastLevel={roastLevel}
                setRoastLevel={setRoastLevel}
                categories={categories}
                toggleCategory={toggleCategory}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-ember/40 bg-ember/10 px-4 py-3 text-sm text-ember">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted/80">
          {step === 0
            ? "No account needed. Nothing is posted anywhere."
            : step === 1
              ? hasAmmunition
                ? "That'll do. This is going to be rough."
                : "We need at least a sentence or two. Or a screenshot."
              : "Last step. Then it's out of your hands."}
        </p>

        {step < 2 ? (
          <Button
            size="lg"
            className="w-full sm:w-auto"
            disabled={
              (step === 0 && subjectType !== "myself" && !consentConfirmed) ||
              (step === 1 && !hasAmmunition)
            }
            onClick={() => go(step + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button size="lg" className="w-full sm:w-auto" disabled={submitting} onClick={submit}>
            {submitting ? (
              <>
                <Loader2 className="size-5 animate-spin" /> Starting…
              </>
            ) : (
              "Roast me 🔥"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

function Progress({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
          <motion.div
            className="h-full rounded-full bg-linear-to-r from-flame to-ember"
            initial={false}
            animate={{ width: i <= step ? "100%" : "0%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      ))}
    </div>
  );
}

function StepSubject({
  subjectType,
  onSelect,
  consentConfirmed,
  onConsentChange,
}: {
  subjectType: SubjectType;
  onSelect: (value: SubjectType) => void;
  consentConfirmed: boolean;
  onConsentChange: (value: boolean) => void;
}) {
  return (
    <div className="space-y-5">
      <p className="text-base text-muted">
        Be honest. The AI can only work with what you hand over.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {SUBJECT_TYPES.map((key) => {
          const option = SUBJECT_TYPE_LABELS[key];
          const active = subjectType === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={cn(
                "glass-card flex items-center gap-3.5 rounded-2xl px-5 py-4 text-left transition-all duration-200",
                active
                  ? "border-flame/70 bg-flame/10 glow-flame"
                  : "hover:border-flame/40 hover:bg-white/8",
              )}
            >
              <span className="text-2xl">{option.emoji}</span>
              <span className="font-display text-base font-bold text-chalk">{option.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {subjectType !== "myself" ? (
          <motion.label
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex cursor-pointer items-start gap-3 overflow-hidden rounded-2xl border border-acid/30 bg-acid/5 p-4"
          >
            <input
              type="checkbox"
              checked={consentConfirmed}
              onChange={(e) => onConsentChange(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-acid"
            />
            <span className="text-sm leading-relaxed text-muted">
              I only have information I&apos;m allowed to share, this person would find it funny, and
              I&apos;m not using this to harass anyone.
            </span>
          </motion.label>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function StepAmmunition({
  pastedText,
  setPastedText,
  aboutText,
  setAboutText,
  images,
  onRemoveImage,
  uploading,
  onPickFiles,
  fileInput,
  onFiles,
  ammunitionChars,
}: {
  pastedText: string;
  setPastedText: (v: string) => void;
  aboutText: string;
  setAboutText: (v: string) => void;
  images: UploadedImage[];
  onRemoveImage: (url: string) => void;
  uploading: boolean;
  onPickFiles: () => void;
  fileInput: React.RefObject<HTMLInputElement | null>;
  onFiles: (files: FileList | null) => void;
  ammunitionChars: number;
}) {
  return (
    <div className="space-y-4">
      <Card className="p-5 sm:p-6">
        <CardEyebrow>Card 1 · Paste text</CardEyebrow>
        <Textarea
          className="mt-3 min-h-32"
          maxLength={8000}
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          placeholder="Paste your bio, profile, intro, resume, dating bio, or anything else..."
        />
      </Card>

      <Card className="p-5 sm:p-6">
        <CardEyebrow>Card 2 · Upload screenshots</CardEyebrow>
        <p className="mt-1.5 text-sm text-muted">
          PNG, JPG or WEBP. Up to {MAX_IMAGES} images, 5 MB each. Deleted automatically after the
          retention window.
        </p>

        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={(e) => void onFiles(e.target.files)}
        />

        <div className="mt-4 flex flex-wrap gap-3">
          {images.map((image) => (
            <div
              key={image.url}
              className="group relative size-20 overflow-hidden rounded-xl border border-edge"
            >
              <Image src={image.url} alt="Uploaded screenshot" fill sizes="80px" className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => onRemoveImage(image.url)}
                className="absolute right-1 top-1 rounded-full bg-ink/85 p-1 text-chalk opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove screenshot"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}

          {images.length < MAX_IMAGES ? (
            <button
              type="button"
              onClick={onPickFiles}
              disabled={uploading}
              className="flex size-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-edge text-muted transition-colors hover:border-flame/60 hover:text-flame disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  <ImagePlus className="size-5" />
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wider">Add</span>
                </>
              )}
            </button>
          ) : null}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <CardEyebrow>Card 3 · Tell us about yourself</CardEyebrow>
        <Textarea
          className="mt-3 min-h-32"
          maxLength={8000}
          value={aboutText}
          onChange={(e) => setAboutText(e.target.value)}
          placeholder="I'm a 25-year-old software engineer... I spend too much money on... My biggest obsession is..."
        />
        <p className="mt-2 text-right text-xs text-muted/60">
          {ammunitionChars} characters of evidence
        </p>
      </Card>
    </div>
  );
}

function StepLevel({
  roastLevel,
  setRoastLevel,
  categories,
  toggleCategory,
}: {
  roastLevel: RoastLevel;
  setRoastLevel: (v: RoastLevel) => void;
  categories: RoastCategory[];
  toggleCategory: (key: RoastCategory) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-3">
        {ROAST_LEVELS.map((key) => {
          const level = ROAST_LEVEL_LABELS[key];
          const active = roastLevel === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setRoastLevel(key)}
              className={cn(
                "glass-card rounded-2xl px-5 py-6 text-left transition-all duration-200",
                active ? "border-flame/70 bg-flame/10 glow-flame" : "hover:border-flame/40",
              )}
            >
              <span className="text-3xl">{level.emoji}</span>
              <p className="mt-3 font-display text-base font-bold text-chalk">{level.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{level.blurb}</p>
            </button>
          );
        })}
      </div>

      <div>
        <p className="font-display text-lg font-bold text-chalk">Choose your angles</p>
        <p className="mt-1 text-sm text-muted">Pick as many as you can survive. Default is everything.</p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {ROAST_CATEGORIES.map((key) => {
            const category = ROAST_CATEGORY_LABELS[key];
            const active = categories.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleCategory(key)}
                className={cn(
                  "rounded-full border px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                  active
                    ? "border-flame bg-flame/15 text-chalk"
                    : "border-edge text-muted hover:border-flame/50 hover:text-chalk",
                )}
              >
                {category.emoji} {category.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="rounded-2xl border border-edge bg-white/[0.03] p-4 text-xs leading-relaxed text-muted/80">
        This is comedy. The AI attacks habits, choices and contradictions — never protected
        characteristics — and everything it says is entertainment, not advice.
      </p>
    </div>
  );
}
