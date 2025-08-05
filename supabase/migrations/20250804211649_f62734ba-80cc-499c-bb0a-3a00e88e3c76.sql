-- Create table for photo priority overrides
CREATE TABLE public.photo_priorities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(photo_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.photo_priorities ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own priorities" 
ON public.photo_priorities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own priorities" 
ON public.photo_priorities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own priorities" 
ON public.photo_priorities 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own priorities" 
ON public.photo_priorities 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_photo_priorities_updated_at
BEFORE UPDATE ON public.photo_priorities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();