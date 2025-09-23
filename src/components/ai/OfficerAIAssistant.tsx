import React, { useState } from 'react';
import { useSaral } from '@/contexts/SaralContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, X } from 'lucide-react';

interface Props {
  projectId?: string;
}

const OfficerAIAssistant: React.FC<Props> = ({ projectId }) => {
  const { askOfficerAI } = useSaral();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

  const onAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const q = question.trim();
      setMessages(prev => [...prev, { role: 'user', content: q }]);
      setQuestion('');
      const res = await askOfficerAI({ question: q, projectId });
      setMessages(prev => [...prev, { role: 'assistant', content: res.answer }]);
      setAnswer(res.answer);
    } catch (e) {
      const fallback = 'Sorry, I could not answer that right now.';
      setMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
      setAnswer(fallback);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Show payments completed this month',
    'What is the total acquired area?',
    'How many notices were issued last 30 days?',
    'Budget spent vs allocated'
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {!open && (
        <Button className="rounded-full h-12 w-12 p-0" onClick={() => setOpen(true)}>
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
      {open && (
        <Card className="w-[380px] shadow-xl border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-base text-white">Officer AI Assistant</CardTitle>
            <button onClick={() => setOpen(false)} className="text-gray-200 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => { setQuestion(p); }}
                  className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="h-56 overflow-y-auto rounded border bg-gray-50 p-2 space-y-2">
              {messages.length === 0 && (
                <div className="text-sm text-gray-500">Ask about totals, trends, or rates (no personal details).</div>
              )}
              {messages.map((m, idx) => (
                <div key={idx} className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${m.role === 'user' ? 'ml-auto bg-blue-600 text-white' : 'mr-auto bg-white border'}`}>
                  {m.content}
                </div>
              ))}
            </div>
            <Textarea
              placeholder="Type your question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button onClick={onAsk} disabled={loading}>
                {loading ? 'Thinking…' : 'Ask'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OfficerAIAssistant;


