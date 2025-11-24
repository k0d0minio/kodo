"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { InfoIcon } from "./icons";

export type ProjectMetadata = {
  name: string;
  description: string;
  startDate: Date | string | null;
  targetDate: Date | string | null;
  progress: number;
  totalIssues: number;
  completedIssues: number;
  inProgressIssues: number;
  status: string;
};

type ProjectInfoProps = {
  metadata: ProjectMetadata;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function formatDate(date: Date | string | null): string {
  if (!date) return "Not set";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(dateObj.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj);
}

export function ProjectInfo({ metadata, trigger, open, onOpenChange }: ProjectInfoProps) {
  const {
    name,
    description,
    startDate,
    targetDate,
    progress,
    totalIssues,
    completedIssues,
    inProgressIssues,
    status,
  } = metadata;

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const sheetOpen = isControlled ? open : internalOpen;
  const setSheetOpen = isControlled ? onOpenChange : setInternalOpen;

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="h-9 min-h-[36px] gap-1.5 px-2.5 sm:h-10 sm:px-3">
      <InfoIcon size={16} className="shrink-0" />
      <span className="hidden sm:inline text-xs sm:text-sm">Project Info</span>
      <span className="sm:hidden text-xs">Info</span>
    </Button>
  );

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>{trigger || defaultTrigger}</SheetTrigger>
      <SheetContent side="right" className="w-[85vw] overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-xl">{name}</SheetTitle>
          {description && (
            <SheetDescription className="text-base text-left">{description}</SheetDescription>
          )}
        </SheetHeader>
        <div className="mt-4 space-y-5 sm:mt-6 sm:space-y-6">
          {/* Status Badge */}
          <div>
            <Badge variant="secondary">{status}</Badge>
          </div>

          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Project Progress</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Issue Statistics */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Total Issues</div>
              <div className="text-2xl font-semibold">{totalIssues}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Completed</div>
              <div className="text-2xl font-semibold text-green-600">{completedIssues}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">In Progress</div>
              <div className="text-2xl font-semibold text-blue-600">{inProgressIssues}</div>
            </div>
          </div>

          {/* Timeline */}
          {(startDate || targetDate) && (
            <div className="space-y-4 border-t pt-4">
              {startDate && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Start Date</div>
                  <div className="text-sm">{formatDate(startDate)}</div>
                </div>
              )}
              {targetDate && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">Target Date</div>
                  <div className="text-sm">{formatDate(targetDate)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ProjectInfoTrigger({ metadata }: { metadata: ProjectMetadata }) {
  return <ProjectInfo metadata={metadata} />;
}
