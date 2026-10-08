import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Clock,
  CreditCard,
  Dumbbell,
  ShieldCheck,
  UsersRound,
  Sparkles,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Navbar } from '../components/layout/Navbar'

const features = [
  {
    icon: UsersRound,
    title: 'Member operations',
    text: 'Manage member journeys, attendance, memberships, and trainer assignments in one precise workspace.',
  },
  {
    icon: BarChart3,
    title: 'Clear business insight',
    text: 'Track membership health, payment trends, and gym performance with practical visual reports.',
  },
  {
    icon: BrainCircuit,
    title: 'Wellness AI tools',
    text: 'Offer general workout ideas, meal planning inspiration, and fitness guidance from a protected AI service.',
  },
]
const stats = [
  ['2,400+', 'active members'],
  ['96%', 'renewal confidence'],
  ['18 hrs', 'saved every week'],
]

function Metric({ label, value, trend }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs font-semibold text-brand-600">{trend} this month</p>
    </div>
  )
}

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div id="top" className="overflow-hidden">
      <Navbar />
      <main>
        <section className="section-shell relative py-16 sm:py-24 lg:py-28">
          <div className="absolute right-[-8rem] top-8 -z-10 h-80 w-80 rounded-full bg-brand-100/70 blur-3xl" />
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <p className="eyebrow mb-5 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-500" />
                Built for ambitious gyms
              </p>
              <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] tracking-[-0.045em] text-ink sm:text-5xl lg:text-6xl">
                Run your gym with more <span className="text-brand-600">clarity</span>, less admin.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                PulseForge brings members, trainers, payments, workouts, equipment, and AI wellness
                tools into one polished operations platform.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/dashboard">
                  <Button size="lg">
                    Explore the platform <ArrowRight size={18} />
                  </Button>
                </Link>
                <Link to="/ai-assistant">
                  <Button size="lg" variant="outline">
                    <Sparkles size={16} /> AI Studio
                  </Button>
                </Link>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-brand-600" />
                  Role-based access
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={17} className="text-brand-600" />
                  Designed for growth
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.55 }}
              className="relative mx-auto w-full max-w-xl"
            >
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft sm:p-7">
                {/* Real-time ongoing Date & Time Container */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-500">Operations overview</p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                        </span>
                        Live
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
                      <p className="text-2xl font-bold tracking-tight text-ink">{formattedDate}</p>
                      <span className="inline-flex items-center gap-1 font-mono text-sm font-bold text-brand-700 bg-brand-50/80 border border-brand-200/70 rounded-lg px-2 py-0.5 shadow-2xs">
                        <Clock size={12} className="text-brand-600" />
                        {formattedTime}
                      </span>
                    </div>
                  </div>
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                    <Activity size={22} className="animate-pulse" />
                  </span>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3">
                  <Metric label="Check-ins today" value="184" trend="+12.4%" />
                  <Metric label="Monthly revenue" value="₹4.82L" trend="+8.1%" />
                </div>

                <div className="mt-5 rounded-2xl bg-slate-950 p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Membership health</p>
                      <p className="mt-1 text-3xl font-bold">92.6%</p>
                    </div>
                    <ShieldCheck className="text-brand-100" size={30} />
                  </div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full w-[92.6%] rounded-full bg-brand-500" />
                  </div>
                  <p className="mt-3 text-xs text-slate-400">Strong retention across active plans</p>
                </div>

                <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
                      <CreditCard size={19} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">Payment follow-up</p>
                      <p className="text-xs text-slate-500">8 invoices require attention</p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-slate-400" />
                </div>
              </div>

              <div className="absolute -bottom-6 -left-5 hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-soft sm:block">
                <p className="text-xs font-medium text-slate-500">Trainer workload</p>
                <p className="mt-1 text-xl font-bold">Well-balanced</p>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className="h-1.5 w-5 rounded-full bg-brand-500" />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="platform" className="border-y border-slate-200 bg-white py-8">
          <div className="section-shell grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {stats.map(([number, label]) => (
              <div key={label} className="py-4 text-center">
                <p className="text-2xl font-bold tracking-tight text-ink">{number}</p>
                <p className="mt-1 text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="section-shell py-20 sm:py-28">
          <div className="max-w-2xl">
            <p className="eyebrow">One connected platform</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-ink sm:text-4xl">
              Purpose-built for the people who make your gym move.
            </h2>
          </div>
          <div className="mt-11 grid gap-5 md:grid-cols-3">
            {features.map(({ icon: Icon, title, text }, index) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-soft"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon size={22} />
                </span>
                <h3 className="mt-6 text-lg font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="insights" className="section-shell pb-20 sm:pb-28">
          <div className="rounded-[28px] bg-slate-950 px-7 py-12 text-white sm:px-12 sm:py-14">
            <p className="eyebrow text-brand-100">Ready when you are</p>
            <div className="mt-3 flex flex-col justify-between gap-7 md:flex-row md:items-end">
              <div>
                <h2 className="max-w-2xl text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
                  A calmer control centre for your entire gym.
                </h2>
                <p className="mt-4 max-w-xl text-slate-300">
                  Built around straightforward workflows your team can learn quickly and explain confidently.
                </p>
              </div>
              <Button size="lg">
                Start your workspace <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-slate-200 bg-white py-7">
        <div className="section-shell flex flex-col justify-between gap-3 text-sm text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} PulseForge. Gym management, thoughtfully organised.</p>
          <p>General wellness information only — not medical advice.</p>
        </div>
      </footer>
    </div>
  )
}
