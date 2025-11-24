import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronLeft, ChevronRight, Facebook, Instagram, Linkedin, Award, HeartHandshake as Handshake, Shield, Users, Phone, Mail } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet';

const getIcon = (key, props) => {
    const icons = { award: Award, handshake: Handshake, shield: Shield, users: Users };
    const IconComponent = icons[key];
    return IconComponent ? <IconComponent {...props} /> : null;
};

const SitePage = () => {
    const [siteData, setSiteData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [portfolioFilter, setPortfolioFilter] = useState('Todos');

    useEffect(() => {
        const fetchSiteData = async () => {
            setLoading(true);
            try {
                const [
                    sectionsRes, servicesRes, testimonialsRes, portfolioRes, partnersRes, bannersRes, equipmentsRes
                ] = await Promise.all([
                    supabase.from('site_sections').select('*'),
                    supabase.from('site_services').select('*').eq('is_active', true).order('display_order'),
                    supabase.from('site_testimonials').select('*').eq('is_active', true).order('display_order'),
                    supabase.from('site_portfolio_items').select('*').eq('is_active', true).order('display_order'),
                    supabase.from('site_partners').select('*').eq('is_active', true).order('display_order'),
                    supabase.from('site_banners').select('*').eq('is_active', true).order('display_order'),
                    supabase.from('site_equipments').select('*').eq('is_active', true).order('display_order'),
                ]);

                const data = {
                    sections: sectionsRes.data.reduce((acc, item) => ({ ...acc, [item.section_key]: item.content }), {}),
                    services: servicesRes.data,
                    testimonials: testimonialsRes.data,
                    portfolioItems: portfolioRes.data,
                    partners: partnersRes.data,
                    banners: bannersRes.data,
                    equipments: equipmentsRes.data,
                };
                setSiteData(data);
            } catch (error) {
                console.error("Error fetching site data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSiteData();
    }, []);

    const heroSlides = siteData?.banners || [];

    const nextSlide = () => setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
    const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));

    useEffect(() => {
        if (heroSlides.length > 1) {
            const slideInterval = setInterval(nextSlide, 5000);
            return () => clearInterval(slideInterval);
        }
    }, [heroSlides.length]);

    const portfolioCategories = ['Todos', ...new Set(siteData?.portfolioItems?.map(item => item.category) || [])];
    const filteredPortfolio = siteData?.portfolioItems?.filter(item => portfolioFilter === 'Todos' || item.category === portfolioFilter);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen bg-background text-foreground"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
    }

    const { sections, services, testimonials, portfolioItems, partners, equipments } = siteData;

    return (
        <div className="site-view-content bg-background text-foreground font-sans">
            <Helmet>
                <title>BL Soluções - Locação de Equipamentos e Serviços</title>
                <meta name="description" content="BL Soluções oferece locação de equipamentos e serviços especializados para diversas necessidades. Qualidade e eficiência para seu projeto." />
            </Helmet>
            {/* Header */}
            <header className="bg-card text-card-foreground sticky top-0 z-50 shadow-lg">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center py-2 border-b border-border text-xs">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1"><Phone size={14} /> (85) 9940-0339</span>
                            <span className="flex items-center gap-1"><Mail size={14} /> comercial@bl.net.br</span>
                        </div>
                        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 h-7">Orçamento</Button>
                    </div>
                    <nav className="flex justify-between items-center py-3">
                        <img alt="BL Soluções Logo" className="h-12" src="https://horizons-cdn.hostinger.com/248eb4f3-2326-4fb0-87c9-c097668888f4/117ff0f826d422f849e550f5d230d240.jpg" />
                        <div className="hidden md:flex items-center gap-6 font-medium">
                            <a href="#inicio" className="hover:text-primary transition-colors">PÁGINA INICIAL</a>
                            <a href="#sobre" className="hover:text-primary transition-colors">QUEM SOMOS</a>
                            <a href="#portfolio" className="hover:text-primary transition-colors">PORTFÓLIO</a>
                            <a href="#servicos" className="hover:text-primary transition-colors">SERVIÇOS</a>
                        </div>
                    </nav>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section id="inicio" className="relative h-[70vh] bg-background text-foreground overflow-hidden">
                    <AnimatePresence>
                        {heroSlides.length > 0 && (
                            <motion.div
                                key={currentSlide}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1 }}
                                className="absolute inset-0"
                            >
                                <img class="w-full h-full object-cover" alt={heroSlides[currentSlide]?.title} src={heroSlides[currentSlide]?.image_url} />
                                <div className="absolute inset-0 bg-black/60"></div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="relative z-10 h-full flex flex-col justify-center items-center text-center">
                        <p className="font-light tracking-widest">{heroSlides[currentSlide]?.subtitle}</p>
                        <h1 className="text-5xl md:text-7xl font-bold my-4">{heroSlides[currentSlide]?.title}</h1>
                        <div className="flex gap-4 mt-6">
                            {heroSlides[currentSlide]?.button_text && heroSlides[currentSlide]?.button_link && (
                                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                                    <Link to={heroSlides[currentSlide].button_link}>{heroSlides[currentSlide].button_text}</Link>
                                </Button>
                            )}
                            <Button variant="outline" className="border-foreground text-foreground hover:bg-foreground hover:text-background font-bold">VER PORTFÓLIO</Button>
                        </div>
                    </div>
                    {heroSlides.length > 1 && (
                        <>
                            <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/50"><ChevronLeft /></button>
                            <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/50"><ChevronRight /></button>
                        </>
                    )}
                </section>

                {/* CTA Bar */}
                {sections.cta_bar && (
                    <section className="bg-primary">
                        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-primary-foreground">{sections.cta_bar.text}</h2>
                            <Button className="bg-card text-card-foreground hover:bg-card/90">{sections.cta_bar.button_text}</Button>
                        </div>
                    </section>
                )}

                {/* About & Values */}
                {sections.about_us && sections.our_values && (
                    <section id="sobre" className="py-20">
                        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-16">
                            <div>
                                <p className="text-sm font-bold text-muted-foreground">{sections.about_us.title}</p>
                                <h2 className="text-3xl font-bold my-2">{sections.about_us.subtitle}</h2>
                                <p className="text-muted-foreground mb-8">{sections.about_us.text}</p>
                                <div className="grid grid-cols-2 gap-6">
                                    {sections.about_us.features.map(feature => (
                                        <div key={feature.text} className="flex items-center gap-3">
                                            {getIcon(feature.icon, { className: "w-8 h-8 text-primary" })}
                                            <span className="font-bold">{feature.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold mb-2">{sections.our_values.title}</h2>
                                <p className="text-muted-foreground mb-6">{sections.our_values.description}</p>
                                <Accordion type="single" collapsible defaultValue="item-0">
                                    {sections.our_values.values.map((value, index) => (
                                        <AccordionItem key={index} value={`item-${index}`}>
                                            <AccordionTrigger className="font-bold">{value.title}</AccordionTrigger>
                                            <AccordionContent>{value.text}</AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        </div>
                    </section>
                )}

                {/* Services */}
                {sections.services_section && services.length > 0 && (
                    <section id="servicos" className="py-20 bg-secondary">
                        <div className="container mx-auto px-4 text-center">
                            <p className="text-sm font-bold text-muted-foreground">{sections.services_section.title}</p>
                            <h2 className="text-3xl font-bold mb-12">{sections.services_section.subtitle}</h2>
                            <div className="grid md:grid-cols-3 items-center gap-8">
                                <div className="space-y-8 text-right">
                                    {services.slice(0, 3).map(service => (
                                        <div key={service.id}>
                                            <h3 className="font-bold text-lg">{service.title}</h3>
                                            <p className="text-muted-foreground">{service.description}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="relative aspect-square rounded-full overflow-hidden shadow-2xl">
                                    <img class="w-full h-full object-cover" alt="Serviços BL Soluções" src="https://images.unsplash.com/photo-1581943870582-f37dbd95fe06" />
                                    <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                                        <img src="https://horizons-cdn.hostinger.com/248eb4f3-2326-4fb0-87c9-c097668888f4/117ff0f826d422f849e550f5d230d240.jpg" alt="BL Soluções Logo" className="h-24" />
                                    </div>
                                </div>
                                <div className="space-y-8 text-left">
                                    {services.slice(3, 6).map(service => (
                                        <div key={service.id}>
                                            <h3 className="font-bold text-lg">{service.title}</h3>
                                            <p className="text-muted-foreground">{service.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Equipments */}
                {equipments.length > 0 && (
                    <section id="equipamentos" className="py-20">
                        <div className="container mx-auto px-4 text-center">
                            <p className="text-sm font-bold text-muted-foreground">NOSSOS EQUIPAMENTOS</p>
                            <h2 className="text-3xl font-bold mb-8">Conheça nossa frota moderna</h2>
                            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {equipments.map(eq => (
                                    <div key={eq.id} className="bg-card rounded-lg shadow-md overflow-hidden">
                                        <img class="w-full h-48 object-cover" alt={eq.name} src={eq.image_url} />
                                        <div className="p-4">
                                            <h3 className="font-bold text-lg mb-2">{eq.name}</h3>
                                            <p className="text-muted-foreground text-sm">{eq.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Portfolio */}
                {sections.portfolio_section && portfolioItems.length > 0 && (
                    <section id="portfolio" className="py-20 bg-secondary">
                        <div className="container mx-auto px-4 text-center">
                            <p className="text-sm font-bold text-muted-foreground">{sections.portfolio_section.title}</p>
                            <h2 className="text-3xl font-bold mb-8">{sections.portfolio_section.subtitle}</h2>
                            <div className="flex justify-center gap-4 mb-8 border-b border-border">
                                {portfolioCategories.map(cat => (
                                    <button key={cat} onClick={() => setPortfolioFilter(cat)} className={`pb-2 font-semibold ${portfolioFilter === cat ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}>{cat.toUpperCase()}</button>
                                ))}
                            </div>
                            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {filteredPortfolio.map(item => (
                                    <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden group">
                                        <img class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" alt={item.title} src={item.image_url} />
                                        <div className="absolute inset-0 bg-black/40 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <h3 className="text-white font-bold">{item.title}</h3>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Testimonials & Partners */}
                {(sections.testimonials_section && testimonials.length > 0) || (sections.partners_section && partners.length > 0) ? (
                    <section className="py-20">
                        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
                            {sections.testimonials_section && testimonials.length > 0 && (
                                <div>
                                    <h2 className="text-3xl font-bold mb-6">{sections.testimonials_section.title}</h2>
                                    {testimonials.map(t => (
                                        <div key={t.id} className="mb-8">
                                            <p className="text-lg italic text-muted-foreground">"{t.testimonial_text}"</p>
                                            <div className="flex items-center gap-4 mt-4">
                                                <img class="w-16 h-16 rounded-full object-cover" alt={t.author_name} src={t.author_image_url || "https://images.unsplash.com/photo-1686643184179-e4b65e15022e"} />
                                                <div>
                                                    <p className="font-bold text-primary">{t.author_name}</p>
                                                    <p className="text-sm text-muted-foreground">{t.author_role}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {sections.partners_section && partners.length > 0 && (
                                <div>
                                    <h2 className="text-3xl font-bold mb-6">{sections.partners_section.title}</h2>
                                    <div className="grid grid-cols-3 gap-4">
                                        {partners.map(p => (
                                            <div key={p.id} className="p-4 bg-card rounded-lg shadow-md flex justify-center items-center grayscale hover:grayscale-0 transition-all">
                                                <img class="h-12 object-contain" alt={p.name} src={p.logo_url || "https://images.unsplash.com/photo-1636044594149-6e2f289c3868"} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                ) : null}
            </main>

            {/* Footer */}
            {sections.footer && (
                <footer className="bg-card text-card-foreground">
                    <div className="container mx-auto px-4 py-12 grid md:grid-cols-4 gap-8">
                        <div>
                            <img src="https://horizons-cdn.hostinger.com/248eb4f3-2326-4fb0-87c9-c097668888f4/117ff0f826d422f849e550f5d230d240.jpg" alt="BL Soluções Logo" className="h-12 mb-4" />
                            <p className="text-muted-foreground text-sm">{sections.footer.about}</p>
                            <div className="flex gap-4 mt-4">
                                <a href={sections.footer.socials.facebook}><Facebook size={20} /></a>
                                <a href={sections.footer.socials.instagram}><Instagram size={20} /></a>
                                <a href={sections.footer.socials.linkedin}><Linkedin size={20} /></a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">HORÁRIO DE ATENDIMENTO</h4>
                            <p className="text-muted-foreground text-sm">Segunda - Sexta: <span className="font-semibold text-foreground">{sections.footer.hours.weekdays}</span></p>
                            <p className="text-muted-foreground text-sm">Sábado e Domingo: <span className="font-semibold text-foreground">{sections.footer.hours.weekends}</span></p>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">NOSSOS SERVIÇOS</h4>
                            <ul className="space-y-2 text-sm">
                                {sections.footer.services.map(s => <li key={s} className="text-muted-foreground hover:text-foreground"><a href="#">{s}</a></li>)}
                            </ul>
                        </div>
                    </div>
                    <div className="bg-background py-4">
                        <p className="text-center text-xs text-muted-foreground">Copyright © {new Date().getFullYear()} BL Soluções. Todos os direitos reservados.</p>
                    </div>
                </footer>
            )}
        </div>
    );
};

export default SitePage;