export type Classification = 'symptom' | 'inquiry' | 'emergency' | 'general';

export interface ConsultationResponse {
  message: string;
  classification: Classification;
  symptoms: string[];
  suspected_diseases: string[];
  recommended_department: string;
  is_emergency: boolean;
  emergency_message: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  analysis?: ConsultationResponse;
  timestamp: Date;
}

export interface Consultation {
  id: string;
  session_id: string;
  patient_message: string;
  ai_response: string;
  classification: string;
  symptoms: string[];
  suspected_diseases: string[];
  recommended_department: string;
  is_emergency: boolean;
  created_at: string;
}
