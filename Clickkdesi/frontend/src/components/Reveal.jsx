import { motion as Motion } from "framer-motion";

export default function Reveal({ children }) {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      {children}
    </Motion.div>
  );
}
