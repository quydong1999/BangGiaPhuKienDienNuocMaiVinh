'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Extend window object for webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface UseSpeechRecognitionProps {
  lang?: string;
  onResult?: (text: string) => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition({ 
  lang = 'vi-VN', 
  onResult, 
  onError 
}: UseSpeechRecognitionProps = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [recognition, setRecognition] = useState<any>(null);

   const onResultRef = useRef<UseSpeechRecognitionProps['onResult']>(onResult);
   const onErrorRef = useRef<UseSpeechRecognitionProps['onError']>(onError);

   useEffect(() => {
     onResultRef.current = onResult;
   }, [onResult]);

   useEffect(() => {
     onErrorRef.current = onError;
   }, [onError]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }

      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = lang;

      recognitionInstance.onstart = () => {
        setIsListening(true);
      };

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (onResultRef.current) {
          onResultRef.current(transcript);
        }
        setIsListening(false);
      };

      recognitionInstance.onerror = (event: any) => {
        setIsListening(false);
        let errorMessage = 'Lỗi nhận diện giọng nói';
        
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Vui lòng cấp quyền sử dụng Microphone';
            break;
          case 'no-speech':
            errorMessage = 'Không nhận diện được giọng nói';
            break;
          case 'network':
            errorMessage = 'Lỗi kết nối mạng';
            break;
        }

        if (onErrorRef.current) {
          onErrorRef.current(errorMessage);
        }
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);

      return () => {
        recognitionInstance.onstart = null;
        recognitionInstance.onresult = null;
        recognitionInstance.onerror = null;
        recognitionInstance.onend = null;
        try {
          recognitionInstance.stop();
        } catch {
          // ignore if already stopped
        }
      };
    }
  }, [lang]);

  const startListening = useCallback(() => {
    if (!recognition) return;
    
    try {
      recognition.start();
    } catch (error) {
      // Handle case where recognition is already started
      console.error('Speech recognition error:', error);
      setIsListening(false);
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (!recognition) return;
    recognition.stop();
    setIsListening(false);
  }, [recognition]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening
  };
}
