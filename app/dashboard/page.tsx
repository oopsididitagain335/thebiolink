'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Link {
  id: string;
  url: string;
  title: string;
  icon?: string;
}

interface User {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  isEmailVerified: boolean;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/dashboard/data');
        if (!res.ok) {
          router.push('/auth/login');
          return;
        }
        const data = await res.json();
        setUser(data.user);
        setLinks(data.links || []);
      } catch (error) {
        router.push('/auth/login');
      }
    };
    fetchUserData();
  }, [router]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!user) return;
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleLinkChange = (index: number, field: keyof Link, value: string) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setLinks(newLinks);
  };

  const addLink = () => {
    setLinks([...links, { id: Date.now().toString(), url: '', title: '', icon: '' }]);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user) return
