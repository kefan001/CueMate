import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Search, MapPin, Filter, Star, X, SlidersHorizontal, LocateFixed } from 'lucide-react';
import { Link } from 'react-router-dom';
import { companions } from '../data/mock';
import BottomNav from '../components/BottomNav';
import Modal from '../components/Modal';
import { useUser } from '../context/UserContext';

export default function Discovery() {
  const { user, requestLocation } = useUser();
  const [activeTab, setActiveTab] = useState('推荐');
  const tabs = ['推荐', '附近', '斯诺克', '中式八球', '高颜值', '助教'];
  const [openSearch, setOpenSearch] = useState(false);
  const [openFilter, setOpenFilter] = useState(false);
  const [query, setQuery] = useState('');
  const [priceMax, setPriceMax] = useState(500);
  const [sort, setSort] = useState<'smart' | 'price_low' | 'rating_high'>('smart');

  const list = useMemo(() => {
    const parseDistance = (d: string) => {
      const n = Number(String(d).replace(/[^0-9.]/g, ''));
      return Number.isFinite(n) ? n : 999;
    };

    const q = query.trim().toLowerCase();
    let data = companions.slice();

    if (activeTab === '附近') {
      data.sort((a, b) => parseDistance(a.distance) - parseDistance(b.distance));
    } else if (activeTab !== '推荐') {
      data = data.filter(c => {
        const hay = `${c.name} ${c.level} ${c.tags.join(' ')}`.toLowerCase();
        return hay.includes(activeTab.toLowerCase());
      });
    }

    data = data.filter(c => c.hourlyRate <= priceMax);

    if (q) {
      data = data.filter(c => {
        const hay = `${c.name} ${c.level} ${c.tags.join(' ')}`.toLowerCase();
        return hay.includes(q);
      });
    }

    if (sort === 'price_low') {
      data.sort((a, b) => a.hourlyRate - b.hourlyRate);
    } else if (sort === 'rating_high') {
      data.sort((a, b) => b.rating - a.rating);
    } else if (activeTab === '推荐') {
      data.sort((a, b) => b.rating * 10 + b.reviewCount - (a.rating * 10 + a.reviewCount));
    }

    return data;
  }, [activeTab, priceMax, query, sort]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* Header */}
      <header className="shrink-0 px-6 pt-12 pb-4 bg-zinc-950/95 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-billiards-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
              CueMate
            </h1>
            <div className="flex items-center text-zinc-400 text-sm mt-1">
              <MapPin className="w-3 h-3 mr-1" />
              <span>{user.locationCity ?? '北京市朝阳区'}</span>
            </div>
            <div className="text-[11px] text-zinc-600 mt-1">{user.locationLabel}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => requestLocation()}
              className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800"
              title="获取定位"
            >
              <LocateFixed className={`w-5 h-5 ${user.locationStatus === 'granted' ? 'text-billiards-400' : 'text-zinc-300'}`} />
            </button>
            <button
              onClick={() => setOpenSearch(true)}
              className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800"
            >
              <Search className="w-5 h-5 text-zinc-300" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap text-sm font-medium transition-colors relative ${
                activeTab === tab ? 'text-white' : 'text-zinc-500'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-2 left-0 right-0 h-0.5 bg-billiards-500 rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* List */}
      <main className="flex-1 overflow-y-auto px-6 pb-24 pt-4" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-zinc-400">
            {query.trim() ? `搜索结果 ${list.length} 位` : `为您推荐 ${list.length} 位陪玩`}
          </h2>
          <button
            onClick={() => setOpenFilter(true)}
            className="flex items-center text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <Filter className="w-3 h-3 mr-1" /> 筛选
          </button>
        </div>

        <div className="space-y-4">
          {list.map((companion, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={companion.id}
            >
              <Link to={`/companion/${companion.id}`} className="block">
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 hover:bg-zinc-900 transition-colors">
                  <div className="flex gap-4">
                    <div className="relative">
                      <img
                        src={companion.avatar}
                        alt={companion.name}
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-zinc-950 rounded-full p-1">
                        <div className="bg-billiards-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {companion.distance}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-base font-semibold text-white truncate">{companion.name}</h3>
                          <p className="text-xs text-gold-400 mt-0.5">{companion.level}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">¥{companion.hourlyRate}</div>
                          <div className="text-[10px] text-zinc-500">/小时</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center text-xs text-zinc-300">
                          <Star className="w-3 h-3 text-gold-400 fill-gold-400 mr-1" />
                          <span className="font-medium text-white mr-1">{companion.rating}</span>
                          <span>({companion.reviewCount})</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {companion.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-zinc-800 text-zinc-300 text-[10px] rounded-md">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>

      <BottomNav />

      <Modal open={openSearch} title="搜索陪玩" onClose={() => setOpenSearch(false)}>
        <div className="space-y-4">
          <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800/60 rounded-2xl px-4 py-3">
            <Search className="w-4 h-4 text-zinc-400" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="输入姓名 / 标签 / 玩法"
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-zinc-500"
            />
            {query ? (
              <button onClick={() => setQuery('')} className="text-zinc-500 hover:text-zinc-200">
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-zinc-500">当前筛选</div>
            <button
              onClick={() => {
                setActiveTab('推荐');
                setPriceMax(500);
                setSort('smart');
              }}
              className="text-xs text-zinc-400 hover:text-white"
            >
              重置
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {tabs.map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  activeTab === t
                    ? 'bg-billiards-500/15 border-billiards-500/40 text-billiards-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setOpenSearch(false);
              setOpenFilter(true);
            }}
            className="w-full py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center gap-2 hover:bg-zinc-800"
          >
            <SlidersHorizontal className="w-4 h-4" /> 更多筛选
          </button>
        </div>
      </Modal>

      <Modal open={openFilter} title="筛选与排序" onClose={() => setOpenFilter(false)}>
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-white">最高时薪</div>
              <div className="text-sm text-zinc-300">¥{priceMax}</div>
            </div>
            <input
              type="range"
              min={50}
              max={500}
              step={10}
              value={priceMax}
              onChange={e => setPriceMax(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="text-[10px] text-zinc-500">提示：这是演示用筛选，数据来自 mock。</div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-white">排序</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'smart', label: '智能' },
                { id: 'price_low', label: '低价优先' },
                { id: 'rating_high', label: '高分优先' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSort(opt.id as any)}
                  className={`py-3 rounded-2xl border text-xs font-medium transition-colors ${
                    sort === opt.id
                      ? 'bg-billiards-500/15 border-billiards-500/40 text-billiards-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setPriceMax(500);
                setSort('smart');
              }}
              className="flex-1 py-3 rounded-2xl border border-zinc-800 text-zinc-300 hover:bg-zinc-900"
            >
              重置
            </button>
            <button
              onClick={() => setOpenFilter(false)}
              className="flex-1 py-3 rounded-2xl bg-billiards-600 text-white font-semibold hover:bg-billiards-500"
            >
              查看结果（{list.length}）
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
