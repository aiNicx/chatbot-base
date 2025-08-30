// Configurazione modulare del chatbot
class Config {
    static async loadConfig() {
        try {
            // Carica la configurazione principale
            const mainConfigResponse = await fetch('config/main-config.json');
            const mainConfig = await mainConfigResponse.json();
            
            // Carica la configurazione specifica (opzionale)
            let specificConfig = null;
            try {
                const specificConfigResponse = await fetch('config/specific-config.json');
                specificConfig = await specificConfigResponse.json();
            } catch (error) {
                console.warn('Configurazione specifica non trovata o non valida, uso solo la configurazione principale');
            }
            
            // Genera il sistema prompt combinato
            const combinedPrompt = this.buildSystemPrompt(mainConfig, specificConfig);
            
            return {
                modelId: mainConfig.modelId,
                primarySystemPrompt: combinedPrompt.primary,
                secondarySystemPrompt: combinedPrompt.secondary,
                webSearch: mainConfig.webSearch || { enabled: false },
                rawConfig: { mainConfig, specificConfig } // Per debug e uso futuro
            };
        } catch (error) {
            console.error('Errore nel caricamento della configurazione:', error);
            return this.getFallbackConfig();
        }
    }

    static buildSystemPrompt(mainConfig, specificConfig) {
        // Costruisce il prompt primario con comportamento e formattazione
        let primaryPrompt = '';
        
        if (mainConfig.systemConfig) {
            // Sezione comportamento
            if (mainConfig.systemConfig.behavior) {
                primaryPrompt += `${mainConfig.systemConfig.behavior.role}\n\n`;
                
                if (mainConfig.systemConfig.behavior.characteristics) {
                    primaryPrompt += `CARATTERISTICHE:\n`;
                    mainConfig.systemConfig.behavior.characteristics.forEach(char => {
                        primaryPrompt += `- ${char}\n`;
                    });
                    primaryPrompt += '\n';
                }
                
                if (mainConfig.systemConfig.behavior.webSearchIntegration) {
                    primaryPrompt += `RICERCA WEB:\n${mainConfig.systemConfig.behavior.webSearchIntegration}\n\n`;
                }
            }
            
            // Sezione formattazione
            if (mainConfig.systemConfig.formatting) {
                primaryPrompt += `FORMATTAZIONE OBBLIGATORIA - ${mainConfig.systemConfig.formatting.required}:\n`;
                mainConfig.systemConfig.formatting.rules.forEach(rule => {
                    primaryPrompt += `- ${rule}\n`;
                });
                primaryPrompt += '\n';
            }
            
            // Sezione struttura risposta
            if (mainConfig.systemConfig.responseStructure) {
                primaryPrompt += `STRUTTURA RISPOSTE:\n`;
                mainConfig.systemConfig.responseStructure.guidelines.forEach(guideline => {
                    primaryPrompt += `- ${guideline}\n`;
                });
                primaryPrompt += '\n';
            }
        }
        
        // Costruisce il prompt secondario con informazioni specifiche
        let secondaryPrompt = null;
        if (specificConfig) {
            secondaryPrompt = this.buildBusinessContextPrompt(specificConfig);
        }
        
        return {
            primary: primaryPrompt.trim(),
            secondary: secondaryPrompt
        };
    }

    static buildBusinessContextPrompt(specificConfig) {
        let prompt = '';
        
        // Identità e specializzazione
        if (specificConfig.businessContext) {
            const identity = specificConfig.businessContext.identity;
            prompt += `${identity.type}: ${identity.description}\n\n`;
            
            if (specificConfig.businessContext.specialization) {
                prompt += `SPECIALIZZAZIONI:\n`;
                specificConfig.businessContext.specialization.forEach(spec => {
                    prompt += `- ${spec}\n`;
                });
                prompt += '\n';
            }
        }
        
        // Base di conoscenza strutturata
        if (specificConfig.knowledgeBase) {
            prompt += `BASE DI CONOSCENZA:\n\n`;
            
            // Informazioni sulla location
            if (specificConfig.knowledgeBase.location) {
                prompt += this.buildLocationSection(specificConfig.knowledgeBase.location);
            }
            
            // Informazioni sul ristorante
            if (specificConfig.knowledgeBase.restaurant) {
                prompt += this.buildRestaurantSection(specificConfig.knowledgeBase.restaurant);
            }
            
            // Pacchetti esperienziali
            if (specificConfig.knowledgeBase.packages) {
                prompt += this.buildPackagesSection(specificConfig.knowledgeBase.packages);
            }
            
            // Trekking
            if (specificConfig.knowledgeBase.trekking) {
                prompt += this.buildTrekkingSection(specificConfig.knowledgeBase.trekking);
            }
            
            // Storia
            if (specificConfig.knowledgeBase.history) {
                prompt += this.buildHistorySection(specificConfig.knowledgeBase.history);
            }
            
            // Contatti
            if (specificConfig.knowledgeBase.contacts) {
                prompt += this.buildContactsSection(specificConfig.knowledgeBase.contacts);
            }
            
            // Cultura locale
            if (specificConfig.knowledgeBase.local_culture) {
                prompt += this.buildLocalCultureSection(specificConfig.knowledgeBase.local_culture);
            }
        }
        
        // Template di risposta
        if (specificConfig.responseTemplates) {
            prompt += this.buildResponseTemplates(specificConfig.responseTemplates);
        }
        
        // Regole contestuali
        if (specificConfig.contextualRules) {
            prompt += this.buildContextualRules(specificConfig.contextualRules);
        }
        
        return prompt.trim();
    }

    static buildLocationSection(location) {
        let section = `## LOCATION - ${location.name}\n`;
        section += `**Posizione**: ${location.position}\n`;
        section += `**Coordinate**: ${location.coordinates}\n\n`;
        
        if (location.description) {
            section += `**Descrizione**: ${location.description}\n\n`;
        }
        
        if (location.geography) {
            if (location.geography.terrain) {
                section += `**Territorio**: ${location.geography.terrain}\n`;
            }
            if (location.geography.view) {
                section += `**Vista**: ${location.geography.view}\n`;
            }
            if (location.geography.climate) {
                section += `**Clima**: ${location.geography.climate}\n`;
            }
            if (location.geography.sunset) {
                section += `**Tramonti**: ${location.geography.sunset}\n`;
            }
            if (location.geography.neighboring_areas) {
                section += `**Zone limitrofe**: ${location.geography.neighboring_areas}\n`;
            }
            section += '\n';
        }
        
        if (location.access) {
            section += `**Accesso principale**: ${location.access.stairs}\n\n`;
            
            if (location.access.alternatives) {
                section += `**Modi alternativi per raggiungere il ristorante**:\n`;
                location.access.alternatives.forEach(alt => {
                    section += `- ${alt}\n`;
                });
                section += '\n';
            }
            
            if (location.access.road_directions) {
                const dirs = location.access.road_directions;
                section += `**Indicazioni stradali** (${dirs.main_road}):\n`;
                section += `- **Da Nord**: ${dirs.from_north}\n`;
                section += `- **Da Sud**: ${dirs.from_south}\n`;
                section += `- **Dalla Costiera**: ${dirs.from_coast}\n\n`;
            }
            
            if (location.access.parking) {
                section += `**Parcheggi**:\n`;
                section += `- ${location.access.parking.coastal_road}\n`;
                section += `- ${location.access.parking.vietri_marina}\n\n`;
            }
        }
        
        if (location.services) {
            section += `**Servizi disponibili**:\n`;
            if (location.services.our_services) {
                section += `*I nostri servizi*:\n`;
                location.services.our_services.forEach(service => {
                    section += `- ${service}\n`;
                });
            }
            if (location.services.beach_facilities) {
                section += `*Lidi in spiaggia*:\n`;
                location.services.beach_facilities.forEach(facility => {
                    section += `- ${facility}\n`;
                });
            }
            if (location.services.beach_rules) {
                section += `*Regole spiaggia*: ${location.services.beach_rules}\n`;
            }
            section += '\n';
        }
        
        if (location.faq && location.faq.length > 0) {
            section += `**Domande frequenti**:\n`;
            location.faq.forEach(faq => {
                section += `- **${faq.question}** ${faq.answer}\n`;
            });
            section += '\n';
        }
        
        return section;
    }

    static buildRestaurantSection(restaurant) {
        let section = `## RISTORANTE - ${restaurant.name}\n`;
        section += `**Ambientazione**: ${restaurant.setting}\n\n`;
        
        if (restaurant.schedule) {
            section += `**Apertura stagionale**: ${restaurant.schedule.season}\n`;
            section += `**Orari servizio**:\n`;
            section += `- Pranzo: ${restaurant.schedule.lunch}\n`;
            section += `- Cena: ${restaurant.schedule.dinner}\n`;
            section += `- Dettagli: ${restaurant.schedule.note}\n\n`;
        }
        
        if (restaurant.specialties) {
            section += `**Specialità della casa**:\n`;
            restaurant.specialties.forEach(spec => {
                section += `- ${spec}\n`;
            });
            section += '\n';
        }
        
        if (restaurant.experiences) {
            section += `**Esperienze uniche**:\n`;
            if (restaurant.experiences.romantic_dinner) {
                section += `- **Cena romantica**: ${restaurant.experiences.romantic_dinner}\n`;
            }
            if (restaurant.experiences.sea_view_tables) {
                section += `- **Vista mare**: ${restaurant.experiences.sea_view_tables}\n`;
            }
            section += '\n';
        }
        
        if (restaurant.lemon_garden) {
            section += `**Il nostro limoneto**: ${restaurant.lemon_garden.description}\n`;
            section += `**Prodotti del limoneto**: ${restaurant.lemon_garden.products}\n\n`;
        }
        
        return section;
    }

    static buildPackagesSection(packages) {
        let section = `## PACCHETTI ESPERIENZIALI\n\n`;
        
        Object.keys(packages).forEach(key => {
            const pkg = packages[key];
            section += `**${pkg.name || key.toUpperCase()}**\n`;
            section += `${pkg.description}\n\n`;
            section += `*Include*:\n`;
            pkg.includes.forEach(item => {
                section += `- ${item}\n`;
            });
            section += '\n';
        });
        
        return section;
    }

    static buildTrekkingSection(trekking) {
        let section = `## TREKKING\n${trekking.intro}\n\n`;
        
        trekking.main_trails.forEach(trail => {
            section += `**${trail.name}**\n`;
            if (trail.full_name && trail.full_name !== trail.name) {
                section += `*${trail.full_name}*\n`;
            }
            section += `- Lunghezza: ${trail.length}\n`;
            if (trail.elevation) {
                section += `- Dislivello: ${trail.elevation}\n`;
            }
            section += `- Durata: ${trail.duration}\n`;
            section += `- Difficoltà: ${trail.difficulty}\n`;
            section += `- Punti di interesse: ${trail.highlights}\n`;
            if (trail.connection) {
                section += `- Collegamento: ${trail.connection}\n`;
            }
            section += '\n';
        });
        
        if (trekking.cai_trails) {
            section += `**Sentieri CAI di riferimento**:\n`;
            trekking.cai_trails.forEach(trail => {
                section += `- ${trail}\n`;
            });
            section += '\n';
        }
        
        if (trekking.recommendation) {
            section += `**Raccomandazione**: ${trekking.recommendation}\n\n`;
        }
        
        return section;
    }

    static buildHistorySection(history) {
        let section = `## STORIA\n`;
        
        if (history.ancient_times) {
            section += `**Origini**: ${history.ancient_times}\n`;
        }
        if (history.papermill_1830) {
            section += `**1830 - La cartiera**: ${history.papermill_1830}\n`;
        }
        if (history.flood_1954) {
            section += `**1954 - L'alluvione**: ${history.flood_1954}\n`;
        }
        if (history.remains) {
            section += `**Resti storici**: ${history.remains}\n`;
        }
        section += '\n';
        
        return section;
    }

    static buildContactsSection(contacts) {
        let section = `## CONTATTI E PRENOTAZIONI\n`;
        section += `**Telefoni**: ${contacts.phones.join(', ')}\n`;
        section += `**Email**: ${contacts.email}\n`;
        section += `**Website**: ${contacts.website}\n`;
        if (contacts.social) {
            section += `**Social**: Instagram, Facebook, TikTok\n`;
        }
        section += `**Come prenotare**: ${contacts.booking}\n`;
        section += `**Lingue parlate**: ${contacts.languages.join(', ')}\n\n`;
        
        return section;
    }

    static buildLocalCultureSection(culture) {
        if (!culture) return '';
        
        let section = `## CULTURA LOCALE\n`;
        
        if (culture.stories) {
            section += `**Storie e aneddoti**: ${culture.stories}\n`;
        }
        if (culture.historical_figures) {
            section += `**Personaggi storici**: ${culture.historical_figures}\n`;
        }
        if (culture.local_experience) {
            section += `**Vivere come un locale**:\n`;
            if (culture.local_experience.scenic_stairway) {
                section += `- ${culture.local_experience.scenic_stairway}\n`;
            }
            if (culture.local_experience.wellness) {
                section += `- ${culture.local_experience.wellness}\n`;
            }
        }
        section += '\n';
        
        return section;
    }

    static buildResponseTemplates(templates) {
        let section = `## TEMPLATE DI RISPOSTA\n\n`;
        
        Object.keys(templates).forEach(key => {
            const template = templates[key];
            section += `**${key.toUpperCase()}**:\n`;
            section += `${template.intro}\n`;
            if (template.methods) {
                template.methods.forEach(method => {
                    section += `${method}\n`;
                });
            }
            if (template.options) {
                template.options.forEach(option => {
                    section += `${option}\n`;
                });
            }
            if (template.packages) {
                template.packages.forEach(pkg => {
                    section += `${pkg}\n`;
                });
            }
            if (template.details) {
                template.details.forEach(detail => {
                    section += `${detail}\n`;
                });
            }
            if (template.note) {
                section += `${template.note}\n`;
            }
            if (template.season_note) {
                section += `${template.season_note}\n`;
            }
            section += '\n';
        });
        
        return section;
    }

    static buildContextualRules(rules) {
        let section = `## REGOLE CONTESTUALI\n\n`;
        
        if (rules.prioritize) {
            section += `**PRIORITÀ**:\n`;
            rules.prioritize.forEach(rule => {
                section += `- ${rule}\n`;
            });
            section += '\n';
        }
        
        if (rules.avoid) {
            section += `**EVITARE**:\n`;
            rules.avoid.forEach(rule => {
                section += `- ${rule}\n`;
            });
            section += '\n';
        }
        
        return section;
    }

    static getFallbackConfig() {
        return {
            modelId: '',
            primarySystemPrompt: 'Sei un assistente virtuale utile, cortese e competente. Il tuo scopo è aiutare gli utenti fornendo informazioni accurate, assistenza con compiti specifici e mantenendo una conversazione amichevole e professionale.',
            secondarySystemPrompt: null,
            webSearch: { enabled: false }
        };
    }
}

// Esporta la classe per uso globale
window.Config = Config;