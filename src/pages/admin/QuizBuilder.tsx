import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService } from '@/services/quizService';
import { QuizData, QuizQuestion } from '@/types/professor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Plus, Trash } from 'lucide-react';

const QuizBuilder = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (moduleId) {
      quizService.getQuizByModuleId(moduleId).then((data: QuizData | null) => {
        setQuiz(data || { title: '', passingScore: 70, questions: [] });
        setIsLoading(false);
      });
    }
  }, [moduleId]);

  const handleQuizDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (quiz) {
      setQuiz({ ...quiz, [e.target.name]: e.target.value });
    }
  };

  const handleQuestionChange = (qIndex: number, field: keyof QuizQuestion, value: string | number) => {
    if (quiz) {
      const newQuestions = [...quiz.questions];
      (newQuestions[qIndex] as any)[field] = value;
      setQuiz({ ...quiz, questions: newQuestions });
    }
  };

  const handleAddQuestion = () => {
    if (quiz) {
      const newQuestion: QuizQuestion = {
        id: `new-q-${Date.now()}`,
        type: 'multiple_choice',
        question: '',
        options: ['', ''],
        correctAnswer: '',
        points: 1,
      };
      setQuiz({ ...quiz, questions: [...quiz.questions, newQuestion] });
    }
  };

  const handleRemoveQuestion = (qIndex: number) => {
    if (quiz) {
      const newQuestions = quiz.questions.filter((_, index) => index !== qIndex);
      setQuiz({ ...quiz, questions: newQuestions });
    }
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    if (quiz) {
      const newQuestions = [...quiz.questions];
      if (newQuestions[qIndex].options) {
        newQuestions[qIndex].options![oIndex] = value;
        setQuiz({ ...quiz, questions: newQuestions });
      }
    }
  };

  const handleAddOption = (qIndex: number) => {
    if (quiz) {
      const newQuestions = [...quiz.questions];
      if (newQuestions[qIndex].options) {
        newQuestions[qIndex].options!.push('');
        setQuiz({ ...quiz, questions: newQuestions });
      }
    }
  };

  const handleRemoveOption = (qIndex: number, oIndex: number) => {
    if (quiz) {
      const newQuestions = [...quiz.questions];
      if (newQuestions[qIndex].options) {
        newQuestions[qIndex].options!.splice(oIndex, 1);
        setQuiz({ ...quiz, questions: newQuestions });
      }
    }
  };

  const handleSaveQuiz = async () => {
    if (quiz && moduleId) {
      try {
        if (quiz.title) { // Check if it's a new quiz being created or an existing one being updated
            await quizService.updateQuiz(moduleId, quiz);
        } else {
            await quizService.createQuiz(moduleId, quiz);
        }
        toast.success('Quiz saved successfully!');
        navigate('/admin/modules');
      } catch (error) {
        toast.error('Failed to save quiz.');
      }
    }
  };

  if (isLoading) return <p>Loading quiz builder...</p>;
  if (!quiz) return <p>Could not load quiz data.</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Quiz Builder</h1>
        <Button variant="outline" onClick={() => navigate(`/admin/module/${moduleId}/quiz/results`)}>View Results</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Quiz Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Label>Title</Label>
          <Input name="title" value={quiz.title} onChange={handleQuizDetailsChange} />
          <Label>Description</Label>
          <Textarea name="description" value={quiz.description || ''} onChange={handleQuizDetailsChange} />
          <Label>Passing Score (%)</Label>
          <Input name="passingScore" type="number" value={quiz.passingScore} onChange={handleQuizDetailsChange} />
        </CardContent>
      </Card>

      {quiz.questions.map((q, qIndex) => (
        <Card key={q.id}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Question {qIndex + 1}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => handleRemoveQuestion(qIndex)}><Trash className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label>Question Text</Label>
            <Textarea value={q.question} onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)} />

            <Label>Question Type</Label>
            <Select value={q.type} onValueChange={(value) => handleQuestionChange(qIndex, 'type', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="true_false">True/False</SelectItem>
              </SelectContent>
            </Select>

            {q.type === 'multiple_choice' && (
              <div className="space-y-2">
                <Label>Options</Label>
                <RadioGroup value={q.correctAnswer} onValueChange={(value) => handleQuestionChange(qIndex, 'correctAnswer', value)}>
                  {q.options?.map((opt, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <RadioGroupItem value={opt} id={`${q.id}-opt-${oIndex}`} />
                      <Input value={opt} onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} />
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(qIndex, oIndex)}><Trash className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </RadioGroup>
                <Button variant="outline" size="sm" onClick={() => handleAddOption(qIndex)}><Plus className="h-4 w-4 mr-2" />Add Option</Button>
              </div>
            )}

            {q.type === 'true_false' && (
              <div className="space-y-2">
                <Label>Correct Answer</Label>
                <Select value={q.correctAnswer} onValueChange={(value) => handleQuestionChange(qIndex, 'correctAnswer', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">True</SelectItem>
                    <SelectItem value="false">False</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleAddQuestion}><Plus className="h-4 w-4 mr-2" />Add Question</Button>
            <Button onClick={handleSaveQuiz}>Save Quiz</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default QuizBuilder;
