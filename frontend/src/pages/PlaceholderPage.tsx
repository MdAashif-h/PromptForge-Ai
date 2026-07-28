import { motion } from 'framer-motion';
import { Construction } from 'lucide-react';
import { pageTransition } from '@/animations/variants';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1 flex items-center justify-center min-h-[60vh]"
    >
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-[#FF7F11]/15"
        >
          <Construction size={28} className="text-[#FF7F11]" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
        <p className="text-sm text-[#A3A3A3]">
          {description || 'This feature is being built. Check back soon!'}
        </p>
      </div>
    </motion.div>
  );
}
