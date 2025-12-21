
import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MessageAvatarProps {
  isUser: boolean;
  timestamp: Date;
}

const MessageAvatar = React.memo(({ isUser }: MessageAvatarProps) => {
  return (
    <motion.div 
      className="flex-shrink-0"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ 
        type: 'spring', 
        stiffness: 500, 
        damping: 30,
        delay: 0.1
      }}
    >
      <Avatar className="w-8 h-8 sm:w-9 sm:h-9">
        {isUser ? (
          <>
            <AvatarImage 
              src="https://www.shutterstock.com/image-vector/vector-illustration-color-avatar-user-600nw-2463110203.jpg" 
              alt="User Avatar" 
            />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              👤
            </AvatarFallback>
          </>
        ) : (
          <>
            <AvatarImage 
              src="https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=100&h=100&fit=crop&crop=face" 
              alt="Finny AI Avatar" 
            />
            <AvatarFallback className="bg-slate-700 text-white">
              🐱
            </AvatarFallback>
          </>
        )}
      </Avatar>
    </motion.div>
  );
});

MessageAvatar.displayName = 'MessageAvatar';

export default MessageAvatar;
