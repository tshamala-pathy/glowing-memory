import React, { useEffect, useState } from "react";
import { Rocket, Users, Briefcase, Headphones } from "lucide-react"; // make sure lucide-react is installed

const StatCard = ({ icon: Icon, value, label, suffix = "" }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = value / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="bg-white rounded-3xl p-10 shadow-lg border hover:shadow-2xl transition text-center">
      <Icon className="w-10 h-10 mx-auto mb-4 text-blue-600" />
      <h3 className="text-5xl font-extrabold text-gray-900">
        {count}
        {suffix}
      </h3>
      <p className="mt-2 text-gray-600 font-medium">{label}</p>
    </div>
  );
};

const StatsSection = () => {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <StatCard icon={Rocket} value={100} suffix="+" label="Projects Completed" />
        <StatCard icon={Users} value={50} suffix="+" label="Happy Clients" />
        <StatCard icon={Briefcase} value={5} suffix="+" label="Years Experience" />
        <StatCard icon={Headphones} value={24} suffix="/7" label="Client Support" />
      </div>
    </section>
  );
};

export default StatsSection;
