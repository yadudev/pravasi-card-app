// Fixed HomePage.jsx with working navigation
import React, { useState } from 'react';
import {
  ShoppingBag,
  Clock,
  MapPin,
  Link,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

// Import reusable components
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Header from '../components/layout/Header';
import CategoryCard from '../components/cards/CategoryCard';
import LoyaltyCard from '../components/cards/LoyaltyCard';
import FeatureCard from '../components/cards/FeatureCard';
import StepIndicator from '../components/ui/StepIndicator';
import FAQ from '../components/ui/FAQ';
import SocialLinks from '../components/ui/SocialLinks';

const HomePage = () => {
  const [activeCategory, setActiveCategory] = useState(0);

  // Data configurations
  const categories = [
    { name: 'Shopping', iconName: 'Shopping', color: 'bg-indigo-950' },
    { name: 'Healthcare', iconName: 'Healthcare', color: 'bg-blue-700' },
    { name: 'Travel', iconName: 'Travel', color: 'bg-indigo-800' },
    { name: 'Dining', iconName: 'Dining', color: 'bg-blue-700' },
  ];

  // Navigation functions with debug logging
  const nextCategory = () => {
    console.log('Next button clicked. Current activeCategory:', activeCategory);
    setActiveCategory((prev) => {
      const newIndex = (prev + 1) % categories.length;
      console.log('Setting activeCategory to:', newIndex);
      return newIndex;
    });
  };

  const prevCategory = () => {
    console.log(
      'Previous button clicked. Current activeCategory:',
      activeCategory
    );
    setActiveCategory((prev) => {
      const newIndex = (prev - 1 + categories.length) % categories.length;
      console.log('Setting activeCategory to:', newIndex);
      return newIndex;
    });
  };

  // Test function to verify state changes
  const handleCategoryClick = (index) => {
    console.log('Category clicked:', index);
    setActiveCategory(index);
  };

  const howItWorksSteps = [
    {
      step: 1,
      title: 'Apply for Your Pravasi Previlage Card',
      description:
        'Fill out a simple form with your name, email, and your preferred discount category (e.g., Restaurants, Fashion, Groceries). Click "Apply Now" to submit your request for a loyalty card.',
    },
    {
      step: 2,
      title: 'Email Verification with OTP',
      description:
        "Once you apply, you'll receive an email with a One-Time Password (OTP). Enter this OTP on the website to verify your identity and confirm your interest in the selected discount offer.",
    },
    {
      step: 3,
      title: 'Activate and Use Your Discount Card',
      description:
        'After OTP verification, your loyalty card will be issued with a countdown timer. Click "Activate Now" before the timer expires.',
    },
  ];

  const features = [
    {
      icon: ShoppingBag,
      title: 'Discounts in All the Right Places',
      description:
        "Whether you're visiting family, dining out, shopping for gifts, or looking for personal care services — our cards unlock special rates at top-rated restaurants, retail outlets, beauty salons, wellness centers, grocery stores, and much more.",
    },
    {
      icon: Clock,
      title: 'Time-Limited Offers That Add Real Value',
      description:
        "We believe in giving you the best when it matters the most. Every card comes with exclusive discounts that are valid for a limited time creating urgency but also ensuring freshness and genuine value. Activate when you're ready and use it before it expires.",
    },
    {
      icon: MapPin,
      title: 'Personalized Offers Based on Your Location & Needs',
      description:
        "Once you select a category (like food, shopping, or wellness), our platform shows you the most relevant offers near you. This way, you only see discounts that you'll actually use tailored for where you are and what you love.",
    },
    {
      icon: Link,
      title: 'Verified Cards & Secure Access Process',
      description:
        "We believe in giving you the best when it matters the most. Every card comes with exclusive discounts that are valid for a limited time creating urgency but also ensuring freshness and genuine value. Activate when you're ready and use it before it expires.",
    },
  ];

  const faqData = [
    {
      question: 'What is a Pravasi Previlage Discount Card?',
      answer:
        'The Pravasi Previlage Card is a digital loyalty card that provides exclusive discounts and offers at partner stores across various categories including shopping, dining, healthcare, and travel.',
    },
    {
      question: 'How do I get a discount card?',
      answer:
        'Simply fill out our application form with your details and preferred category, verify your email with the OTP we send, and your digital card will be issued immediately.',
    },
    {
      question: 'Why do I need to enter an OTP?',
      answer:
        'OTP verification ensures the security of your account and confirms that you have access to the email address provided during registration.',
    },
    {
      question: 'How long is the card valid after activation?',
      answer:
        'Cards are typically valid for 12 months from the date of activation. You can check the exact expiry date in your digital card.',
    },
    {
      question: 'Can I reuse the same card?',
      answer:
        'Yes, once activated, you can use your card multiple times at any of our partner locations until it expires.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="px-6 ml-4 py-8">
        <section className="bg-[#7AC3FB] py-24 px-6 relative overflow-hidden rounded-3xl">
          {/* Background decorative elements */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-cyan-400/20"></div>

          <div className="max-w-7xl mx-auto text-center relative z-10">
            <h1
              className="font-figtree text-4xl md:text-6xl font-bold mb-12 leading-tight text-transparent bg-clip-text"
              style={{
                backgroundImage:
                  'linear-gradient(271.57deg, #52B4FF -27.72%, #0066B5 99.65%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Unlock Amazing Discounts with
              <br />
              Our Pravasi Previlage Card.
            </h1>

            {/* Loyalty Card Display */}
            <div className="mb-16 flex justify-center">
              <LoyaltyCard />
            </div>

            {/* CTA Section - matching the UI layout */}
            <div className="mx-4 md:mx-8 lg:mx-12 font-figtree">
              <div className="flex flex-col md:flex-row items-center justify-between mt-16">
                {/* Left text */}
                <div className="text-left mb-6 md:mb-0 flex-1">
                  <p className="text-xl text-[#222158] font-semibold">
                    Enjoy exclusive savings at your
                    <br />
                    favorite stores. Shop smart, save
                    <br />
                    big!
                  </p>
                </div>

                {/* Center button */}
                <div className="flex-shrink-0 mx-8">
                  <button className="bg-sky-300 hover:bg-sky-200 font-semibold px-10 py-4 rounded-full shadow-lg flex items-center space-x-2 transition-colors duration-200">
                    <span className="text-[#222158] font-semibold text-xl">
                      APPLY NOW
                    </span>
                    <ArrowUpRight
                      size={20}
                      className="text-[#222158] font-semibold text-xl"
                    />
                  </button>
                </div>

                {/* Right text */}
                <div className="text-right flex-1">
                  <div className="text-[#222158] font-semibold text-xl">
                    Activate & Save Instantly!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Categories Section */}
      <section className="py-16 px-6 ml-4 bg-gray-50 font-figtree">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2
                className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text"
                style={{
                  backgroundImage:
                    'linear-gradient(271.09deg, #222158 2.79%, #AFDCFF 106.22%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Explore Partnered Categories & Brands
              </h2>
              <p className="text-[#707070] text-xl">
                Discover stores by category and use your Pravasi Privilege Card
                to unlock exclusive in-store benefits.
              </p>
            </div>

            {/* Navigation buttons with better styling */}
            <div className="flex space-x-2">
              <button
                onClick={prevCategory}
                className="p-3 rounded-full border-2 border-gray-800 hover:bg-gray-800 hover:text-white transition-all duration-200 z-10"
                aria-label="Previous category"
              >
                <ArrowLeft size={20} />
              </button>
              <button
                onClick={nextCategory}
                className="p-3 rounded-full border-2 border-gray-800 hover:bg-gray-800 hover:text-white transition-all duration-200 z-10"
                aria-label="Next category"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <CategoryCard
                key={category.name}
                category={category}
                isActive={activeCategory === index}
                onClick={() => handleCategoryClick(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-16 text-blue-400">
            How It Works
          </h2>

          <StepIndicator
            steps={howItWorksSteps}
            currentStep={3}
            orientation="horizontal"
          />
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-16 px-6 bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 text-white relative overflow-hidden">
        {/* Decorative card elements */}
        <div className="absolute top-0 right-0 transform rotate-12 opacity-20">
          <Card className="w-48 h-32 bg-white/10" />
        </div>
        <div className="absolute bottom-0 left-0 transform -rotate-12 opacity-20">
          <Card className="w-48 h-32 bg-white/10" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center">
            Why Choose Pravasi Privilege Card?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                variant="dark"
              />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Left side - FAQ Title */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-blue-400 mb-6">
                FAQs
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Here's what most users want to know before getting started.
              </p>
            </div>

            {/* Right side - FAQ Items */}
            <div>
              <FAQ questions={faqData} />
            </div>
          </div>
        </div>
      </section>

      {/* Footer/Contact Section */}
      <footer className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Top Navigation */}
          <div className="mb-12">
            <nav className="flex flex-wrap gap-8 text-white/80">
              <a href="#" className="hover:text-white transition-colors">
                Home
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Categories
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Apply for Card
              </a>
              <a href="#" className="hover:text-white transition-colors">
                FAQ
              </a>
            </nav>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Contact Info */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Let's talk
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Ask us anything on Pravasi Privilege...
              </p>

              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Follow us:</h3>
                <SocialLinks variant="light" />
              </div>
            </div>

            {/* Right side - Contact Form */}
            <Card className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Contact Us
                  </h3>
                  <p className="text-gray-600">
                    Have questions or need assistance? We're here to help.
                  </p>
                </div>
                <div className="text-blue-700 font-bold text-lg">PRAVASI</div>
              </div>

              <form className="space-y-6">
                <Input
                  label="Email ID"
                  placeholder="Enter your email address"
                  type="email"
                  required
                />

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full bg-indigo-900 hover:bg-indigo-800"
                >
                  Subscribe
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
