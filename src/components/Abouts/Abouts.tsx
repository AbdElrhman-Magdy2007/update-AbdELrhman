'use client';

import ScrollStack, { ScrollStackItem } from './ScrollStack'

const About = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black text-white relative overflow-hidden">
        <h1 className="text-4xl md:text-6xl font-bold mb-8">About Me</h1>
        <p className="max-w-2xl text-center text-lg md:text-xl leading-relaxed">
            I'm a passionate developer with a knack for creating beautiful and functional web applications. With expertise in modern frameworks and a keen eye for design, I strive to deliver exceptional user experiences. When I'm not coding, you can find me exploring the latest tech trends or indulging in my love for photography.
        </p>

<ScrollStack>
  <ScrollStackItem>
    <h2>Card 1</h2>
    <p>This is the first card in the stack</p>
  </ScrollStackItem>
  <ScrollStackItem>
    <h2>Card 2</h2>
    <p>This is the second card in the stack</p>
  </ScrollStackItem>
  <ScrollStackItem>
    <h2>Card 3</h2>
    <p>This is the third card in the stack</p>
  </ScrollStackItem>
</ScrollStack>
    </div>
  );
}

export default About;
