'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, createContext, useContext, useTransition } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ExternalLink, Github, Search, X, AlertCircle, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getProductsByCategory } from '../server/db/products';
import { debounce } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';
import 'tailwindcss/tailwind.css';

// Define data types
interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  techs: string[];
  addons: string[];
  link: string;
  demoUrl?: string | null;
  githubUrl?: string | null;
  featured: boolean;
  category: string;
  projectType: 'Full-Stack' | 'Front-End' | 'Back-End';
  productTechs?: { name: string }[];
  createdAt: string;
  updatedAt: string;
}

interface CategoryWithProducts {
  name: string;
  icon: string;
  projects?: Project[];
}

// Context for state management
interface ProjectsContextType {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

const useProjects = () => {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
};

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.95, rotateX: 10 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
      duration: 0.7,
    },
  },
  hover: {
    scale: 1.03,
    rotateY: 5,
    rotateX: -5,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

const buttonVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 120,
      damping: 12,
      duration: 0.6,
    },
  },
  hover: {
    scale: 1.15,
    boxShadow: '0 0 20px rgba(58, 41, 255, 0.4)',
    filter: 'brightness(1.1)',
    transition: { duration: 0.3 },
  },
  tap: { scale: 0.9 },
};

// Constants
const LOG_PREFIX = '[Projects]';
const ENABLE_DETAILED_LOGGING = true;
const DEFAULT_IMAGE = 'https://via.placeholder.com/600x400?text=Project+Image';
const POLLING_INTERVAL = 3600000; // 1 hour
const MIN_FETCH_INTERVAL = 10000; // Minimum 10s between fetches

// Utility function for consistent logging
const logProduct = (projects: Project[], action: 'added' | 'updated' | 'removed', count: number) => {
  console.groupCollapsed(`${LOG_PREFIX} [${action.toUpperCase()}] ${count} project(s)`);
  if (ENABLE_DETAILED_LOGGING) {
    projects.forEach(project => {
      console.log({
        id: project.id,
        title: project.title,
        description: project.description,
        category: project.category,
        projectType: project.projectType,
        image: project.image,
        techs: project.techs,
        addons: project.addons,
        demoUrl: project.demoUrl || 'N/A',
        githubUrl: project.githubUrl || 'N/A',
        featured: project.featured,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        timestamp: new Date().toISOString(),
      });
    });
  }
  console.log(`${LOG_PREFIX} Summary: ${count} project(s) ${action}`);
  console.groupEnd();
};

// Project Card Component
const ProjectCard: React.FC<{ project: Project }> = React.memo(({ project }) => {
  const [imgSrc, setImgSrc] = React.useState<string>(
    project.image && project.image !== '/placeholder-image.png' ? project.image : DEFAULT_IMAGE
  );
  const isRecent = new Date(project.createdAt).getTime() > Date.now() - 5 * 60 * 1000;
  const isValidDemoUrl = project.demoUrl && !project.demoUrl.includes('/admin/') && project.demoUrl !== 'https://full-stack-portfolio-a333-jq4tls75b.vercel.app/admin/menu-items/new';
  const isValidGithubUrl = project.githubUrl && !project.githubUrl.includes('/admin/');
  const imageSrc = imgSrc;

  return (
    <motion.div
      variants={cardVariants}
      initial={isRecent ? 'hidden' : 'hidden'}
      animate="visible"
      whileHover="hover"
      className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-500 shadow-lg hover:shadow-2xl"
      role="article"
      aria-labelledby={`project-title-${project.id}`}
    >
      <div className="relative">
        <div className="aspect-[4/3] md:aspect-video overflow-hidden rounded-t-2xl">
          <Image
            src={imageSrc}
            alt={`Screenshot of ${project.title} project`}
            width={600}
            height={400}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            loading={project.featured ? 'eager' : 'lazy'}
            priority={project.featured}
            onError={() => setImgSrc(DEFAULT_IMAGE)}
          />
        </div>
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        />
        {project.featured && (
          <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            Featured
          </span>
        )}
      </div>
      <div className="flex flex-col p-6 flex-grow">
        <h3
          id={`project-title-${project.id}`}
          className="text-xl font-bold mb-2 bg-gradient-to-r from-[#7B61FF] to-[#38BDF8] bg-clip-text text-transparent"
        >
          {project.title}
        </h3>
        <p className="text-gray-300 text-sm mb-4 line-clamp-3 flex-grow">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {project.techs.map((tech, i) => (
            <span
              key={`${project.id}-tech-${i}`}
              className="bg-gradient-to-r from-[#FF6AC2] to-[#7B61FF] text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur-md"
            >
              {tech}
            </span>
          ))}
          {project.addons.map((addon, i) => (
            <motion.span
              key={`${project.id}-addon-${i}`}
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              whileTap="tap"
              className="bg-gradient-to-r from-[#14055e] to-[#14055e] text-white text-xs font-medium px-3 py-1 rounded-full backdrop-blur-md"
            >
              {addon}
            </motion.span>
          ))}
        </div>
        <div className="flex flex-col gap-3 mt-auto">
          {isValidDemoUrl && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    className="w-full min-w-[120px] flex items-center justify-center gap-2 px-6 py-2 text-base font-medium rounded-full bg-gradient-to-r from-[#7B61FF] to-[#38BDF8] text-white hover:brightness-110 shadow-md transition"
                    aria-label={`Demo button for ${project.title}`}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Demo
                  </motion.a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Visit the live site</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {isValidGithubUrl && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    className="w-full min-w-[120px] flex items-center justify-center gap-2 px-6 py-2 text-base font-medium rounded-full bg-gradient-to-r from-[#FF6AC2] to-[#FF3B80] text-white hover:brightness-110 shadow-md transition"
                    aria-label={`GitHub button for ${project.title}`}
                  >
                    <Github className="w-4 h-4" />
                    GitHub
                  </motion.a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View source code on GitHub</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {!isValidDemoUrl && !isValidGithubUrl && (
            <p className="text-gray-400 text-sm text-center">Links under development</p>
          )}
        </div>
      </div>
    </motion.div>
  );
});

// Category Button Component
const CategoryButton: React.FC<{
  category: CategoryWithProducts;
  isSelected: boolean;
  onSelect: (name: string) => void;
  index: number;
  total: number;
}> = ({ category, isSelected, onSelect, index, total }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(category.name);
    } else if (e.key === 'ArrowRight' && index < total - 1) {
      (document.querySelectorAll('button.category-button')[index + 1] as HTMLButtonElement)?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      (document.querySelectorAll('button.category-button')[index - 1] as HTMLButtonElement)?.focus();
    }
  };

  return (
    <motion.button
      ref={buttonRef}
      onClick={() => onSelect(category.name)}
      onKeyDown={handleKeyDown}
      className={`category-button px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        isSelected ? 'bg-blue-500 text-white' : 'bg-sky-700 dark:bg-gray-700 text-gray-900 dark:text-gray-200'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-pressed={isSelected}
      aria-label={`Filter projects by ${category.name}`}
    >
      <span className="text-lg">{category.icon}</span>
      <span>{category.name}</span>
    </motion.button>
  );
};

// Loading Skeleton Component
const ProjectCardSkeleton: React.FC = () => (
  <div className="overflow-hidden rounded-2xl bg-white/5 border border-white/10 shadow-lg">
    <Skeleton className="h-48 w-full bg-gray-200/20" />
    <div className="p-6">
      <Skeleton className="h-6 w-3/4 bg-gray-200/20 mb-2" />
      <Skeleton className="h-4 w-full bg-gray-200/20 mb-4" />
      <div className="flex flex-wrap gap-2 mb-4">
        <Skeleton className="h-4 w-16 bg-gray-200/20 rounded-full" />
        <Skeleton className="h-4 w-16 bg-gray-200/20 rounded-full" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-full bg-gray-200/20 rounded-full" />
        <Skeleton className="h-8 w-full bg-gray-200/20 rounded-full" />
      </div>
    </div>
  </div>
);

// Main ProjectsShowcase Component
const ProjectsShowcase: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryWithProducts[]>([]);
  const [projectsData, setProjectsData] = useState<Project[]>([]);
  const [isPending, startTransition] = useTransition();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const previousProjectsRef = useRef<Project[]>([]);
  const isPollingActive = useRef(true);
  const lastFetchTimeRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollPositionRef = useRef<number>(0);

  // Preserve scroll position
  const saveScrollPosition = useCallback(() => {
    scrollPositionRef.current = window.scrollY;
  }, []);

  const restoreScrollPosition = useCallback(() => {
    window.scrollTo({ top: scrollPositionRef.current, behavior: 'smooth' });
  }, []);

  // Compare projects to avoid unnecessary updates
  const areProjectsEqual = useCallback((newProjects: Project[], oldProjects: Project[]): boolean => {
    if (newProjects.length !== oldProjects.length) return false;
    return newProjects.every((newProj, i) => {
      const oldProj = oldProjects[i];
      return (
        newProj.id === oldProj.id &&
        newProj.title === oldProj.title &&
        newProj.description === oldProj.description &&
        newProj.image === oldProj.image &&
        newProj.projectType === oldProj.projectType &&
        JSON.stringify(newProj.techs) === JSON.stringify(oldProj.techs) &&
        JSON.stringify(newProj.addons) === JSON.stringify(oldProj.addons) &&
        newProj.demoUrl === oldProj.demoUrl &&
        newProj.githubUrl === oldProj.githubUrl &&
        newProj.category === oldProj.category
      );
    });
  }, []);

  // Debounced state update
  const updateProjectsData = useMemo(
    () =>
      debounce((newCategories: CategoryWithProducts[], newProjects: Project[]) => {
        startTransition(() => {
          if (!areProjectsEqual(newProjects, projectsData)) {
            setCategories(newCategories);
            setProjectsData(newProjects);
            previousProjectsRef.current = newProjects;
            setError(null);
            restoreScrollPosition();
          }
        });
      }, 500),
    [projectsData, areProjectsEqual, restoreScrollPosition]
  );

  // Fetch categories and projects
  const fetchCategories = useCallback(
    async (retryCount = 2) => {
      const now = Date.now();
      if (now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL) {
        console.log(`${LOG_PREFIX} Skipping fetch: too soon since last fetch`);
        return;
      }

      const requestId = uuidv4();
      abortControllerRef.current = new AbortController();

      try {
        saveScrollPosition();
        console.log(`${LOG_PREFIX} [${requestId}] Fetching categories`);
        const result = await getProductsByCategory();
        if (!Array.isArray(result)) {
          throw new Error('Invalid response from server');
        }
        const mappedCategories = [
          { name: 'All', icon: '🌐', projects: [] },
          ...result.map(category => ({
            ...category,
            name: category.name,
            icon: '🗂️',
            projects: category.products?.map(project => ({
              id: project.id,
              title: project.name,
              description: project.description,
              image: project.image,
              techs: project.ProductTech?.map(tech => tech.name) || [],
              addons: project.ProductAddon?.map(addon => addon.name) || [],
              link: project.liveDemoLink || '',
              demoUrl: project.liveDemoLink,
              githubUrl: project.gitHubLink,
              featured: false,
              category: category.name,
              projectType: 'Full-Stack' as const,
              productTechs: project.ProductTech,
              productAddons: project.ProductAddon,
              createdAt: project.createdAt.toISOString(),
              updatedAt: project.updatedAt.toISOString(),
            })),
          })),
        ];
        const newProjects = mappedCategories.flatMap(category => category.projects || []);

        // Detect changes
        const previousIds = new Set(previousProjectsRef.current.map(p => p.id));
        const newIds = new Set(newProjects.map(p => p.id));
        const addedProjects = newProjects.filter(p => !previousIds.has(p.id));
        const removedProjects = previousProjectsRef.current.filter(p => !newIds.has(p.id));

        // Log changes
        if (addedProjects.length > 0) {
          logProduct(addedProjects, 'added', addedProjects.length);
          toast({
            title: 'New Projects Added',
            description: `${addedProjects.length} new project(s) added.`,
            duration: 3000,
            className: 'bg-blue-500 text-white',
          });
        }
        if (removedProjects.length > 0) {
          logProduct(removedProjects, 'removed', removedProjects.length);
          toast({
            title: 'Projects Removed',
            description: `${removedProjects.length} project(s) removed.`,
            duration: 3000,
            className: 'bg-blue-500 text-white',
          });
        }

        updateProjectsData(mappedCategories, newProjects);
        lastFetchTimeRef.current = now;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log(`${LOG_PREFIX} [${requestId}] Fetch aborted`);
          return;
        }
        console.error(`${LOG_PREFIX} [${requestId}] Error fetching categories:`, {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        if (retryCount > 0) {
          console.log(`${LOG_PREFIX} [${requestId}] Retrying... (${retryCount} attempts left)`);
          setTimeout(() => fetchCategories(retryCount - 1), 5000);
        } else {
          setError('Failed to load projects. Showing cached data.');
          toast({
            title: 'Loading Error',
            description: 'Failed to load projects. Showing cached data.',
            variant: 'destructive',
            duration: 5000,
            className: 'bg-red-500 text-white',
          });
          updateProjectsData(categories, projectsData);
        }
      } finally {
        if (retryCount === 0 || !error) {
          setIsLoading(false);
        }
      }
    },
    [updateProjectsData, projectsData, categories, error]
  );

  // Polling with visibility awareness
  useEffect(() => {
    fetchCategories();
    const interval = setInterval(() => {
      if (isPollingActive.current) {
        fetchCategories();
      }
    }, POLLING_INTERVAL);

    const handleVisibilityChange = () => {
      isPollingActive.current = !document.hidden;
      if (isPollingActive.current) {
        fetchCategories();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchCategories]);

  // Debounced input handler for search box
  const debouncedSetSearchQuery = useMemo(
    () => debounce((query: string) => {
      setSearchQuery(query);
    }, 250),
    []
  );

  // Clear search query
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
      searchInputRef.current.focus();
    }
  }, []);

  // Filter projects
  const filteredProjects = useMemo(() => {
    let projects = projectsData;
    if (selectedCategory !== 'All') {
      projects = projects.filter(project => project.category === selectedCategory);
    }
    if (!searchQuery.trim()) return projects;
    const keywords = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return projects.filter(project => {
      const haystack = [
        project.title,
        project.description,
        project.category,
        project.projectType,
        ...(project.techs || []),
        ...(project.addons || [])
      ].join(' ').toLowerCase();
      return keywords.every(kw =>
        haystack.includes(kw) ||
        haystack.split(' ').some(word => word.startsWith(kw) || word.includes(kw))
      );
    });
  }, [projectsData, selectedCategory, searchQuery]);

  // Keyboard navigation for search focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && searchInputRef.current && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading || isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl w-full px-4">
          {[...Array(6)].map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <ProjectsContext.Provider value={{ selectedCategory, setSelectedCategory, searchQuery, setSearchQuery }}>
      <section className="py-16 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={containerVariants}
            aria-live="polite"
            aria-atomic="true"
          >
            <motion.div variants={itemVariants} className="text-center mb-12 mt-10">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#7B61FF] via-[#FF6AC2] to-[#38BDF8] bg-clip-text text-transparent mb-4">
                Our Creative Projects
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Explore our portfolio of innovative web solutions, showcasing modern technology and creative design.
              </p>
              <div className="h-1 w-24 bg-gradient-to-r from-[#7B61FF] to-[#FF6AC2] mx-auto mt-6 rounded-full" />
            </motion.div>

            <motion.div variants={itemVariants} className="mb-12">
              <div className="relative max-w-md mx-auto mb-8">
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search projects by name, tech, or type (press /)"
                  onChange={(e) => debouncedSetSearchQuery(e.target.value)}
                  className="pl-10 pr-10 py-2 w-full bg-white/5 border-white/10 rounded-lg text-gray-300 placeholder-gray-400"
                  aria-label="Search projects"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    aria-label="Clear search"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                {categories.map((category, index) => (
                  <CategoryButton
                    key={`${category.name}-${index}`}
                    category={category}
                    isSelected={selectedCategory === category.name}
                    onSelect={setSelectedCategory}
                    index={index}
                    total={categories.length}
                  />
                ))}
              </div>
            </motion.div>

            {error && (
              <motion.div
                variants={itemVariants}
                className="text-center py-8 bg-red-500/30 rounded-lg mb-8"
              >
                <p className="text-lg font-semibold text-white">{error}</p>
                <motion.button
                  onClick={() => fetchCategories()}
                  className="mt-4 px-4 py-2 rounded-full bg-gradient-to-r from-[#7B61FF] to-[#38BDF8] text-white hover:brightness-110"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Reload projects"
                >
                  <RefreshCw className="h-4 w-4 inline mr-2" />
                  Retry
                </motion.button>
              </motion.div>
            )}

            <motion.div
              variants={containerVariants}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto"
            >
              <AnimatePresence mode="sync">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))
                ) : (
                  <motion.div
                    variants={itemVariants}
                    className="col-span-full text-center py-12"
                    key="no-projects"
                  >
                    <p className="text-lg font-semibold text-white">
                      No projects found
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Try another category or search term.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </ProjectsContext.Provider>
  );
};

export default ProjectsShowcase;