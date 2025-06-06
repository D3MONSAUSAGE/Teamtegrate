
import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

export const useChatBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showDragHint, setShowDragHint] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const location = useLocation();
  
  const isChatPage = location.pathname.includes('/chat');

  useEffect(() => {
    if (isMobile) {
      const checkKeyboard = () => {
        setIsKeyboardVisible(document.activeElement?.tagName === 'TEXTAREA');
      };

      document.addEventListener('focusin', checkKeyboard);
      document.addEventListener('focusout', () => setIsKeyboardVisible(false));

      return () => {
        document.removeEventListener('focusin', checkKeyboard);
        document.removeEventListener('focusout', () => setIsKeyboardVisible(false));
      };
    }
  }, [isMobile]);

  useEffect(() => {
    if (isChatPage && !localStorage.getItem('chatbot-drag-hint-shown')) {
      setShowDragHint(true);
      const timer = setTimeout(() => {
        setShowDragHint(false);
        localStorage.setItem('chatbot-drag-hint-shown', 'true');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isChatPage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const shouldHide = isMobile && isKeyboardVisible && isChatPage;

  return {
    isOpen,
    setIsOpen,
    message,
    setMessage,
    isKeyboardVisible,
    showDragHint,
    messagesEndRef,
    messageContainerRef,
    isMobile,
    isChatPage,
    shouldHide,
    scrollToBottom
  };
};
