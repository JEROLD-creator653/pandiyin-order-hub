import { motion } from 'framer-motion';
import { Leaf, Heart, Sun, Users, Sparkles, Award, Shield, Zap, TrendingUp, Target } from 'lucide-react';

export default function About() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' as const },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/10">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-4 pt-24 pb-16 max-w-4xl text-center"
      >
        <motion.div className="mb-6">
          <Leaf className="h-16 w-16 mx-auto text-green-600 mb-4" />
        </motion.div>
        <h1 className="text-5xl md:text-6xl font-bold font-display mb-4 bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
          Our Story
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          From the heart of Madurai, we bring you authentic, handcrafted food products made with love, tradition, and the finest natural ingredients.
        </p>
      </motion.div>

      {/* Main Story Section */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        className="container mx-auto px-4 max-w-4xl py-12"
      >
        <motion.div variants={itemVariants} className="prose prose-lg max-w-none space-y-6 text-muted-foreground mb-16">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4">The Beginning</h2>
            <p>
              PANDIYIN was born from a simple belief — food should be pure, honest, and full of the flavors our grandmothers knew. In a world of mass-produced packaged foods with artificial ingredients and preservatives, we chose a different path.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Philosophy</h2>
            <p>
              Every product in our collection is handcrafted in small batches by skilled home cooks in Madurai. We use only the finest locally sourced ingredients — no preservatives, no artificial colors, no shortcuts. What you get is authenticity in every bite, just like home-made food.
            </p>
          </div>
        </motion.div>

        {/* Timeline Section */}
        <motion.div variants={itemVariants} className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Our Journey</h2>
          <div className="space-y-6">
            {[
              {
                year: '2020',
                title: 'The Spark',
                description: 'Started with a vision to preserve traditional recipes and bring them to modern homes.',
              },
              {
                year: '2021',
                title: 'First Products',
                description: 'Launched our signature pickles, dry goods, and spice blends with 100% natural ingredients.',
              },
              {
                year: '2022',
                title: 'Community Growth',
                description: 'Expanded our artisan network, now supporting 20+ home-based food producers.',
              },
              {
                year: '2023',
                title: 'Quality Recognition',
                description: 'Received certifications for food safety and quality standards from certified bodies.',
              },
              {
                year: '2024',
                title: 'National Reach',
                description: 'Expanded delivery across India, bringing authentic flavors to thousands of families.',
              },
            ].map((milestone, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="flex gap-6 pb-8 relative"
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">
                    {milestone.year.slice(-2)}
                  </div>
                  {i !== 4 && <div className="w-1 h-16 bg-green-600/30 mt-4" />}
                </div>
                <div className="py-2">
                  <h3 className="text-xl font-bold text-foreground">{milestone.title}</h3>
                  <p className="text-muted-foreground mt-2">{milestone.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Core Values Grid */}
        <motion.div variants={itemVariants} className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Why Choose PANDIYIN</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Heart,
                title: 'Made with Love',
                desc: 'Every product is handcrafted with care and traditional recipes from our hearts.',
              },
              {
                icon: Leaf,
                title: '100% Natural',
                desc: 'Pure ingredients sourced locally. Zero preservatives, no artificial colors or flavors.',
              },
              {
                icon: Sun,
                title: 'Traditional Methods',
                desc: 'Sun-dried, slow-cooked, and aged using time-tested methods for authentic taste.',
              },
              {
                icon: Users,
                title: 'Community Driven',
                desc: 'Supporting local artisans, farmers, and home-based food producers from Madurai.',
              },
              {
                icon: Award,
                title: 'Quality Assured',
                desc: 'Certified food safety standards and rigorous quality control at every step.',
              },
              {
                icon: Zap,
                title: 'Fresh & Fast',
                desc: 'Small batches ensure freshness. Prepared to order with quick nationwide delivery.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -5, transition: { duration: 0.3 } }}
                className="p-6 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-green-200/50 dark:border-green-900/30 hover:shadow-lg transition-shadow"
              >
                <item.icon className="h-10 w-10 text-green-600 mb-4" />
                <h3 className="font-bold text-lg text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quality & Hygiene Section */}
        <motion.div
          variants={itemVariants}
          className="mb-16 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-8 border border-green-200/50"
        >
          <h2 className="text-3xl font-bold text-foreground mb-6">Quality & Food Safety</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Safety Standards
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>✓ FSSAI certified kitchen facilities</li>
                <li>✓ Regular health inspections</li>
                <li>✓ Hygienic packaging and handling</li>
                <li>✓ Traceability for all ingredients</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-green-600" />
                Natural Ingredients
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>✓ No artificial preservatives</li>
                <li>✓ No synthetic additives</li>
                <li>✓ No refined sugars (in select products)</li>
                <li>✓ Sourced from trusted local suppliers</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Mission & Vision */}
        <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="p-8 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-blue-200/50">
            <Target className="h-10 w-10 text-blue-600 mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-3">Our Mission</h3>
            <p className="text-muted-foreground">
              To bring authentic, handcrafted, naturally-made food products from local artisans to families across India, preserving traditional recipes while maintaining the highest quality and food safety standards.
            </p>
          </div>
          <div className="p-8 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-purple-200/50">
            <TrendingUp className="h-10 w-10 text-purple-600 mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-3">Our Vision</h3>
            <p className="text-muted-foreground">
              A world where every home can enjoy pure, natural food made with love and tradition — supporting local communities and celebrating the rich culinary heritage of India.
            </p>
          </div>
        </motion.div>

        {/* Trust & Testimonials */}
        <motion.div variants={itemVariants} className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">Trusted by Families</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { number: '5000+', label: 'Happy Customers' },
              { number: '50+', label: 'Product Varieties' },
              { number: '25+', label: 'Home Producers' },
            ].map((stat, i) => (
              <motion.div key={i} variants={itemVariants} className="p-6">
                <p className="text-4xl font-bold text-green-600 mb-2">{stat.number}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          variants={itemVariants}
          className="text-center pt-8 border-t border-border"
        >
          <p className="text-lg text-muted-foreground mb-4">
            Thank you for being part of our journey. Every purchase supports local artisans and helps preserve traditional food practices.
          </p>
          <p className="text-sm text-muted-foreground italic">
            "Food prepared with love, delivered with care" - PANDIYIN
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
