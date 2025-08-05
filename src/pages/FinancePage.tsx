import React, { useState, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import FinancialTracking from '../components/FinancialTracking';
import PageHeader from '../components/layout/PageHeader';
import usePageMetadata from '../hooks/use-page-metadata';
import TabContainer, { TabItem } from '../components/layout/TabContainer';
import { Button } from "@/components/ui/button";
import { Download, Upload, PieChart, BarChart, CreditCard, DollarSign, Filter, CalendarRange, Plus, FileText } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditableField } from '@/components/ui/editable-field';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import FinancialCharts from '../components/statistics/FinancialCharts';
import FinancialForecast from '../components/statistics/FinancialForecast';
import BudgetPlanning from '../components/BudgetPlanning';
import { toast } from 'sonner';
import { StatisticsProvider } from '../contexts/StatisticsContext';

const FinancePage = () => {
  const { toast: shadowToast } = useToast();
  const { 
    title, 
    description, 
    handleTitleChange, 
    handleDescriptionChange 
  } = usePageMetadata({
    defaultTitle: 'Gestion Financière',
    defaultDescription: 'Suivez vos revenus, dépenses et la rentabilité de votre exploitation agricole'
  });

  const [timeFrame, setTimeFrame] = useState('year');
  const [filterCategory, setFilterCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [incomeTitle, setIncomeTitle] = useState('Gestion des Revenus');
  const [incomeDescription, setIncomeDescription] = useState('Suivez, catégorisez et analysez toutes vos sources de revenus agricoles');
  const [expensesTitle, setExpensesTitle] = useState('Gestion des Dépenses');
  const [expensesDescription, setExpensesDescription] = useState('Catégorisez et optimisez toutes vos dépenses liées à l\'exploitation');
  const [reportsTitle, setReportsTitle] = useState('Rapports Financiers');
  const [reportsDescription, setReportsDescription] = useState('Générez des rapports détaillés pour analyser la performance financière de votre exploitation');
  const [forecastTitle, setForecastTitle] = useState('Prévisions Financières');
  const [forecastDescription, setForecastDescription] = useState('Simulez différents scénarios pour anticiper l\'évolution de votre situation financière');
  const [budgetTitle, setBudgetTitle] = useState('Gestion Budgétaire');
  const [budgetDescription, setBudgetDescription] = useState('Planifiez et suivez votre budget pour optimiser vos dépenses');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [showAddIncomeForm, setShowAddIncomeForm] = useState(false);
  const [showAddExpenseForm, setShowAddExpenseForm] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);

  const handleExportData = () => {
    toast.success("Export des données financières", {
      description: "Vos données ont été exportées au format Excel"
    });
  };

  const handleImportData = () => {
    setImportDialogOpen(true);
  };

  const handleImportConfirm = (importType: string) => {
    setImportDialogOpen(false);
    toast.success("Import de données réussi", {
      description: `Les données ${importType} ont été importées avec succès`
    });
  };

  const handleGenerateReport = () => {
    setReportGenerating(true);
    
    setTimeout(() => {
      setReportGenerating(false);
      toast.success("Génération de rapport", {
        description: `Rapport financier ${timeFrame} généré et prêt à télécharger`
      });
    }, 1500);
  };
  
  const handleAddIncome = () => {
    setShowAddIncomeForm(true);
    
    setTimeout(() => {
      setShowAddIncomeForm(false);
      toast.success("Revenu ajouté", {
        description: "Le nouveau revenu a été ajouté avec succès"
      });
    }, 1000);
  };
  
  const handleAddExpense = () => {
    setShowAddExpenseForm(true);
    
    setTimeout(() => {
      setShowAddExpenseForm(false);
      toast.success("Dépense ajoutée", {
        description: "La nouvelle dépense a été ajoutée avec succès"
      });
    }, 1000);
  };
  
  const handleActivateModule = (moduleName: string) => {
    toast.success(`Module ${moduleName} activé`, {
      description: `Le module de ${moduleName.toLowerCase()} a été activé avec succès`
    });
  };
  
  const handleCardDetailClick = (cardType: string) => {
    toast.info(`Détails ${cardType}`, {
      description: `Affichage des détails de ${cardType.toLowerCase()}`
    });
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    toast.info("Changement d'onglet", {
      description: `Vous consultez maintenant l'onglet ${value === 'overview' ? 'Aperçu' : 
                                                        value === 'income' ? 'Revenus' : 
                                                        value === 'expenses' ? 'Dépenses' :
                                                        value === 'forecast' ? 'Prévisions' :
                                                        value === 'budget' ? 'Budget' : 'Rapports'}`
    });
  };

  const renderHeaderActions = () => {
    return (
      <div className="flex flex-wrap space-x-2">
        <Button variant="outline" onClick={handleExportData}>
          <Download className="mr-2 h-4 w-4" />
          Exporter
        </Button>
        
        <Button variant="outline" onClick={handleImportData}>
          <Upload className="mr-2 h-4 w-4" />
          Importer
        </Button>
        
        <Button 
          onClick={() => {
            if (activeTab === 'overview') {
              handleGenerateReport();
            } else if (activeTab === 'income') {
              handleAddIncome();
            } else if (activeTab === 'expenses') {
              handleAddExpense();
            } else if (activeTab === 'forecast') {
              toast.info("Simulation lancée", {
                description: "La simulation financière est en cours d'exécution"
              });
            } else if (activeTab === 'budget') {
              toast.info("Budget enregistré", {
                description: "Les modifications du budget ont été sauvegardées"
              });
            } else {
              handleGenerateReport();
            }
          }}
        >
          {activeTab === 'overview' ? (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Générer un rapport
            </>
          ) : activeTab === 'income' ? (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un revenu
            </>
          ) : activeTab === 'expenses' ? (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une dépense
            </>
          ) : activeTab === 'forecast' ? (
            <>
              <BarChart className="mr-2 h-4 w-4" />
              Lancer une simulation
            </>
          ) : activeTab === 'budget' ? (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une catégorie
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Nouveau rapport
            </>
          )}
        </Button>
        
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Importer des données financières</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground">Choisissez le type de données à importer:</p>
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" className="justify-start" onClick={() => handleImportConfirm('bancaires')}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Données bancaires (CSV)
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => handleImportConfirm('comptables')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Données comptables (Excel)
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => handleImportConfirm('factures')}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Factures scannées (PDF)
                </Button>
              </div>
              <div className="flex justify-end">
                <Button variant="ghost" onClick={() => setImportDialogOpen(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  const tabs: TabItem[] = [
    {
      value: 'overview',
      label: 'Aperçu général',
      content: (
        <StatisticsProvider>
          <div className="space-y-6">
            <FinancialTracking />
            <FinancialCharts />
          </div>
        </StatisticsProvider>
      )
    },
    {
      value: 'income',
      label: 'Revenus',
      content: (
        <div className="p-6 bg-white rounded-xl border">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-500" />
            <EditableField
              value={incomeTitle}
              onSave={(value) => {
                setIncomeTitle(String(value));
                toast.success("Titre mis à jour", {
                  description: "Le titre de la section revenus a été modifié"
                });
              }}
            />
          </h2>
          <p className="text-muted-foreground mb-6">
            <EditableField
              value={incomeDescription}
              onSave={(value) => {
                setIncomeDescription(String(value));
                toast.success("Description mise à jour", {
                  description: "La description de la section revenus a été modifiée"
                });
              }}
            />
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleCardDetailClick('Récoltes')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Badge className="mr-2 bg-green-100 text-green-800 hover:bg-green-200">Ventes</Badge> 
                  Récoltes
                </CardTitle>
                <CardDescription>Ventes de produits agricoles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45 860 €</div>
                <p className="text-sm text-green-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586l3.293-3.293A1 1 0 0114 7h-2z" clipRule="evenodd" />
                  </svg>
                  +12.5% comparée à l'an dernier
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" size="sm" className="w-full" onClick={(e) => {
                  e.stopPropagation();
                  handleCardDetailClick('Récoltes');
                }}>
                  <FileText className="h-4 w-4 mr-2" />
                  Détails
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleCardDetailClick('PAC')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Badge className="mr-2 bg-blue-100 text-blue-800 hover:bg-blue-200">Subventions</Badge> 
                  PAC
                </CardTitle>
                <CardDescription>Aides agricoles et subventions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">18 500 €</div>
                <p className="text-sm text-blue-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                    <path fillRule="evenodd" d="M1 10a5 5 0 015-5h8a5 5 0 015 5v8a1 1 0 01-2 0v-8z" clipRule="evenodd" />
                  </svg>
                  Stable par rapport à l'an dernier
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" size="sm" className="w-full" onClick={(e) => {
                  e.stopPropagation();
                  handleCardDetailClick('PAC');
                }}>
                  <FileText className="h-4 w-4 mr-2" />
                  Détails
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleCardDetailClick('Autres revenues')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Badge className="mr-2 bg-purple-100 text-purple-800 hover:bg-purple-200">Autres</Badge> 
                  Revenues
                </CardTitle>
                <CardDescription>Locations, visites, services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7 250 €</div>
                <p className="text-sm text-purple-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586l3.293-3.293A1 1 0 0114 7h-2z" clipRule="evenodd" />
                  </svg>
                  +28.3% comparé à l'an dernier
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" size="sm" className="w-full" onClick={(e) => {
                  e.stopPropagation();
                  handleCardDetailClick('Autres revenues');
                }}>
                  <FileText className="h-4 w-4 mr-2" />
                  Détails
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Sources de revenus récentes</h3>
            <Button onClick={handleAddIncome}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un revenu
            </Button>
          </div>
          
          {showAddIncomeForm ? (
            <div className="animate-fade-in bg-muted/20 rounded-lg p-6 text-center border border-primary/20">
              <DollarSign className="h-12 w-12 mx-auto text-primary mb-2" />
              <h3 className="text-lg font-semibold mb-2">Ajout d'un nouveau revenu</h3>
              <p className="text-muted-foreground mb-4">Traitement en cours...</p>
              <div className="w-full bg-muted rounded-full h-2 mb-4">
                <div className="bg-primary h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
              </div>
            </div>
          ) : (
            <div className="bg-muted/20 rounded-lg p-6 text-center">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <h3 className="text-lg font-semibold mb-2">Module de gestion des revenus</h3>
              <p className="text-muted-foreground mb-4">
                Activez ce module pour suivre en détail toutes vos sources de revenus
                et générer des rapports personnalisés.
              </p>
              <Button onClick={() => handleActivateModule('gestion des revenus')}>Activer ce module</Button>
            </div>
          )}
        </div>
      )
    },
    {
      value: 'expenses',
      label: 'Dépenses',
      content: (
        <div className="p-6 bg-white rounded-xl border">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-red-500" />
            <EditableField
              value={expensesTitle}
              onSave={(value) => {
                setExpensesTitle(String(value));
                toast.success("Titre mis à jour", {
                  description: "Le titre de la section dépenses a été modifié"
                });
              }}
            />
          </h2>
          <p className="text-muted-foreground mb-6">
            <EditableField
              value={expensesDescription}
              onSave={(value) => {
                setExpensesDescription(String(value));
                toast.success("Description mise à jour", {
                  description: "La description de la section dépenses a été modifiée"
                });
              }}
            />
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleCardDetailClick('Semences & Fertilisants')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Badge className="mr-2 bg-amber-100 text-amber-800 hover:bg-amber-200">Intrants</Badge> 
                  Semences & Fertilisants
                </CardTitle>
                <CardDescription>Achats pour la production</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12 750 €</div>
                <p className="text-sm text-red-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                    <path fillRule="evenodd" d="M12 13a1 1 0 100-2H7.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L7.414 13H12z" clipRule="evenodd" />
                  </svg>
                  +8.3% comparé à l'an dernier
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" size="sm" className="w-full" onClick={(e) => {
                  e.stopPropagation();
                  handleCardDetailClick('Semences & Fertilisants');
                }}>
                  <FileText className="h-4 w-4 mr-2" />
                  Détails
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleCardDetailClick('Matériel')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Badge className="mr-2 bg-indigo-100 text-indigo-800 hover:bg-indigo-200">Équipement</Badge> 
                  Matériel
                </CardTitle>
                <CardDescription>Machines et outils</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23 600 €</div>
                <p className="text-sm text-green-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                    <path fillRule="evenodd" d="M8 7a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H4a1 1 0 110-2h3V8a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  -15.2% comparé à l'an dernier
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" size="sm" className="w-full" onClick={(e) => {
                  e.stopPropagation();
                  handleCardDetailClick('Matériel');
                }}>
                  <FileText className="h-4 w-4 mr-2" />
                  Détails
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleCardDetailClick('Main d\'oeuvre')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Badge className="mr-2 bg-teal-100 text-teal-800 hover:bg-teal-200">Services</Badge> 
                  Main d'oeuvre
                </CardTitle>
                <CardDescription>Salaires, prestataires</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">15 320 €</div>
                <p className="text-sm text-red-600 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                    <path fillRule="evenodd" d="M12 13a1 1 0 100-2H7.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L7.414 13H12z" clipRule="evenodd" />
                  </svg>
                  +5.7% comparé à l'an dernier
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="outline" size="sm" className="w-full" onClick={(e) => {
                  e.stopPropagation();
                  handleCardDetailClick('Main d\'oeuvre');
                }}>
                  <FileText className="h-4 w-4 mr-2" />
                  Détails
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Dépenses récentes</h3>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="intrants">Intrants</SelectItem>
                <SelectItem value="equipement">Équipement</SelectItem>
                <SelectItem value="services">Services</SelectItem>
                <SelectItem value="administrative">Administrative</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {showAddExpenseForm ? (
            <div className="animate-fade-in bg-muted/20 rounded-lg p-6 text-center border border-primary/20">
              <CreditCard className="h-12 w-12 mx-auto text-primary mb-2" />
              <h3 className="text-lg font-semibold mb-2">Ajout d'une nouvelle dépense</h3>
              <p className="text-muted-foreground mb-4">Traitement en cours...</p>
              <div className="w-full bg-muted rounded-full h-2 mb-4">
                <div className="bg-primary h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
              </div>
            </div>
          ) : (
            <div className="bg-muted/20 rounded-lg p-6 text-center">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <h3 className="text-lg font-semibold mb-2">Module de gestion des dépenses</h3>
              <p className="text-muted-foreground mb-4">
                Activez ce module pour catégoriser, suivre et optimiser 
                toutes vos dépenses en détail.
              </p>
              <Button onClick={() => handleActivateModule('gestion des dépenses')}>Activer ce module</Button>
            </div>
          )}
        </div>
      )
    },
    {
      value: 'forecast',
      label: 'Prévisions',
      content: (
        <StatisticsProvider>
          <div className="p-6 bg-white rounded-xl border">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-indigo-500" />
              <EditableField
                value={forecastTitle}
                onSave={(value) => {
                  setForecastTitle(String(value));
                  toast.success("Titre mis à jour", {
                    description: "Le titre de la section prévisions a été modifié"
                  });
                }}
              />
            </h2>
            <p className="text-muted-foreground mb-6">
              <EditableField
                value={forecastDescription}
                onSave={(value) => {
                  setForecastDescription(String(value));
                  toast.success("Description mise à jour", {
                    description: "La description de la section prévisions a été modifiée"
                  });
                }}
              />
            </p>
            
            <FinancialForecast />
          </div>
        </StatisticsProvider>
      )
    },
    {
      value: 'budget',
      label: 'Budget',
      content: (
        <div className="p-6 bg-white rounded-xl border">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2 text-orange-500" />
            <EditableField
              value={budgetTitle}
              onSave={(value) => {
                setBudgetTitle(String(value));
                toast.success("Titre mis à jour", {
                  description: "Le titre de la section budget a été modifié"
                });
              }}
            />
          </h2>
          <p className="text-muted-foreground mb-6">
            <EditableField
              value={budgetDescription}
              onSave={(value) => {
                setBudgetDescription(String(value));
                toast.success("Description mise à jour", {
                  description: "La description de la section budget a été modifiée"
                });
              }}
            />
          </p>
          
          <BudgetPlanning />
        </div>
      )
    },
    {
      value: 'reports',
      label: 'Rapports',
      content: (
        <div className="p-6 bg-white rounded-xl border">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <BarChart className="h-5 w-5 mr-2 text-blue-500" />
            <EditableField
              value={reportsTitle}
              onSave={(value) => {
                setReportsTitle(String(value));
                toast.success("Titre mis à jour", {
                  description: "Le titre de la section rapports a été modifié"
                });
              }}
            />
          </h2>
          <p className="text-muted-foreground mb-6">
            <EditableField
              value={reportsDescription}
              onSave={(value) => {
                setReportsDescription(String(value));
                toast.success("Description mise à jour", {
                  description: "La description de la section rapports a été modifiée"
                });
              }}
            />
          </p>
          
          <div className="mb-6">
            <div className="p-4 bg-muted/30 rounded-lg mb-4">
              <h3 className="font-medium mb-2">Période d'analyse</h3>
              <div className="tabs tabs-boxed inline-flex p-1 bg-muted rounded-md">
                <button 
                  className={`py-1.5 px-3 rounded-sm ${timeFrame === 'month' ? 'bg-background shadow-sm' : 'hover:bg-muted/80'}`}
                  onClick={() => setTimeFrame('month')}
                >
                  Mois en cours
                </button>
                <button 
                  className={`py-1.5 px-3 rounded-sm ${timeFrame === 'quarter' ? 'bg-background shadow-sm' : 'hover:bg-muted/80'}`}
                  onClick={() => setTimeFrame('quarter')}
                >
                  Trimestre
                </button>
                <button 
                  className={`py-1.5 px-3 rounded-sm ${timeFrame === 'year' ? 'bg-background shadow-sm' : 'hover:bg-muted/80'}`}
                  onClick={() => setTimeFrame('year')}
                >
                  Année
                </button>
                <button 
                  className={`py-1.5 px-3 rounded-sm ${timeFrame === 'custom' ? 'bg-background shadow-sm' : 'hover:bg-muted/80'}`}
                  onClick={() => setTimeFrame('custom')}
                >
                  Personnalisé
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-4 w-4 mr-2 text-muted-foreground" />
                  Rapports disponibles
                </CardTitle>
                <CardDescription>
                  Sélectionnez un rapport à générer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={handleGenerateReport}>
                  <BarChart className="h-4 w-4 mr-2" />
                  Rapport de rentabilité
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleGenerateReport}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Analyse des dépenses
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  Génération de rapports
                </CardTitle>
                <CardDescription>
                  État de la génération
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportGenerating ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <span>Génération du rapport {timeFrame}...</span>
                      <span className="text-sm text-muted-foreground">75%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full animate-pulse" style={{width: '75%'}}></div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Veuillez patienter pendant la compilation des données financières...
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h4 className="text-lg font-medium mb-2">Aucun rapport en cours</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choisissez un type de rapport à gauche pour lancer la génération
                    </p>
                    <Button variant="outline" onClick={handleGenerateReport}>
                      Générer un rapport
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }
  ];

  return (
    <PageLayout>
      <PageHeader 
        title={title}
        description={description}
        onTitleChange={handleTitleChange}
        onDescriptionChange={handleDescriptionChange}
      />
      
      <div className="mb-6">
        {renderHeaderActions()}
      </div>
      
      <TabContainer 
        tabs={tabs} 
        defaultValue={activeTab}
        onValueChange={handleTabChange}
      />
    </PageLayout>
  );
};

export default FinancePage;
