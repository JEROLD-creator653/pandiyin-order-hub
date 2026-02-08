import { motion } from 'framer-motion';
import { Leaf, Heart, Sun, Users } from 'lucide-react';

export default function About() {
  return (
    <div className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <Leaf className="h-12 w-12 mx-auto text-primary mb-4" />
        <h1 className="text-4xl font-display font-bold mb-4">Our Story</h1>
        <p className="text-lg text-muted-foreground">From the heart of Madurai, with love in every pack.</p>
      </motion.div>

      <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
        <p>PANDIYIN was born from a simple belief — food should be pure, honest, and full of the flavors our grandmothers knew. In a world of mass-produced packaged foods, we choose to stay true to tradition.</p>
        <p>Every product in our collection is handcrafted in small batches by skilled home cooks in Madurai. We use only the finest locally sourced ingredients — no preservatives, no artificial colors, no shortcuts.</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-12">
        {[
          { icon: Heart, title: 'Made with Love', desc: 'Every product is handcrafted with care and tradition.' },
          { icon: Leaf, title: '100% Natural', desc: 'Pure ingredients, zero preservatives.' },
          { icon: Sun, title: 'Sun-Dried Goodness', desc: 'Traditional methods for authentic taste.' },
          { icon: Users, title: 'Community First', desc: 'Supporting local artisans and farmers.' },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className="p-6 rounded-lg bg-secondary/50 text-center">
            <item.icon className="h-8 w-8 mx-auto text-primary mb-3" />
            <h3 className="font-semibold font-sans mb-1">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
