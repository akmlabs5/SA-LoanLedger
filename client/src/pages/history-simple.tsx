import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HistorySimplePage() {
  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Portfolio History
          </h1>
          <p className="text-muted-foreground mt-1">
            Track exposure trends and transaction history over time
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Page</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Simple history page is working!</p>
        </CardContent>
      </Card>
    </div>
  );
}