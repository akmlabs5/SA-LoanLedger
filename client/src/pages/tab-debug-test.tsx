import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs-debug";
import { Button } from "@/components/ui/button";

export default function TabDebugTest() {
  const [activeTab, setActiveTab] = useState("tab1");
  const [clickLog, setClickLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setClickLog(prev => [...prev, `${timestamp}: ${message}`].slice(-20));
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Tab Click Behavior Debug Test</CardTitle>
          <p className="text-sm text-muted-foreground">
            Test single-click vs double-click behavior on tabs. Watch the console for detailed event logs.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Tabs */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Test Tabs (With Debug Logging)</h3>
            <Tabs value={activeTab} onValueChange={(val) => {
              addLog(`Tab changed to: ${val}`);
              setActiveTab(val);
            }}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger 
                  value="tab1"
                  data-testid="tab-1"
                >
                  Tab 1
                </TabsTrigger>
                <TabsTrigger 
                  value="tab2"
                  data-testid="tab-2"
                >
                  Tab 2
                </TabsTrigger>
                <TabsTrigger 
                  value="tab3"
                  data-testid="tab-3"
                >
                  Tab 3
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tab1" className="mt-4 p-4 border rounded">
                <h4 className="font-semibold">Tab 1 Content</h4>
                <p>This is the content of tab 1.</p>
              </TabsContent>

              <TabsContent value="tab2" className="mt-4 p-4 border rounded">
                <h4 className="font-semibold">Tab 2 Content</h4>
                <p>This is the content of tab 2.</p>
              </TabsContent>

              <TabsContent value="tab3" className="mt-4 p-4 border rounded">
                <h4 className="font-semibold">Tab 3 Content</h4>
                <p>This is the content of tab 3.</p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Regular Button for Comparison */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Regular Button (For Comparison)</h3>
            <Button 
              onClick={() => addLog('Button clicked')}
              data-testid="test-button"
            >
              Click Me
            </Button>
          </div>

          {/* Click Event Log */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Event Log</h3>
            <div className="border rounded p-4 bg-gray-50 dark:bg-gray-900 max-h-60 overflow-y-auto font-mono text-sm">
              {clickLog.length === 0 ? (
                <p className="text-muted-foreground">No events yet. Try clicking tabs or the button.</p>
              ) : (
                clickLog.map((log, i) => (
                  <div key={i} className="py-1">{log}</div>
                ))
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded border border-blue-200">
            <h3 className="font-semibold mb-2">Debug Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Open browser DevTools (F12) and go to Console tab</li>
              <li>Click on tabs above - watch for [TAB DEBUG] logs in console</li>
              <li>Note the event sequence (mousedown, pointerdown, click, etc.)</li>
              <li>Compare with regular button behavior</li>
              <li>Check if multiple events fire or if events are blocked</li>
              <li>Hover over tabs to see event log overlays appear</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
