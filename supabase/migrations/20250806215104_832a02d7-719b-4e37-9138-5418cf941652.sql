-- Create a table for photo captions
CREATE TABLE public.photo_captions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  photo_id TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(photo_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.photo_captions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own captions" 
ON public.photo_captions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own captions" 
ON public.photo_captions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own captions" 
ON public.photo_captions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own captions" 
ON public.photo_captions 
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
CREATE TRIGGER update_photo_captions_updated_at
BEFORE UPDATE ON public.photo_captions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();