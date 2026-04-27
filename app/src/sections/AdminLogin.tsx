import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AdminLoginProps {
  onNavigate: (page: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function AdminLogin({ onNavigate }: AdminLoginProps) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Inloggen mislukt');
      }

      login(data.token, data.user);
      onNavigate('admin-dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Inloggen mislukt. Controleer je gegevens.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full min-h-[calc(100vh-120px)] flex items-center justify-center py-20 bg-gradient-to-b from-[#faf9f7] to-white">
      <div className="w-full max-w-md px-4">
        <Card className="shadow-2xl border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-[#6b0f1a] to-[#8b1523] p-8 text-center">
            <div className="mx-auto w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
              <Lock className="h-10 w-10 text-[#d4af37]" />
            </div>
            <h1 className="logo-font text-3xl text-white mb-2">
              <span className="text-white">Mo</span>
              <span className="logo-font-italic text-[#d4af37]">&</span>
              <span className="text-white">Ma</span>
            </h1>
            <p className="text-stone-300">Admin Dashboard</p>
          </div>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-stone-700 font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-[#6b0f1a]" />
                  Gebruikersnaam
                </Label>
                <Input
                  id="username"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="admin"
                  required
                  autoComplete="username"
                  className="border-stone-300 focus:border-[#6b0f1a] focus:ring-[#6b0f1a]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-stone-700 font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#6b0f1a]" />
                  Wachtwoord
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="border-stone-300 focus:border-[#6b0f1a] focus:ring-[#6b0f1a] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-[#6b0f1a] hover:bg-[#8b1523] text-white py-6 font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Inloggen...
                  </>
                ) : (
                  'Inloggen'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
