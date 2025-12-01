
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AidCategory, AidItem, AidRequest, RequestStatus } from '../types';
import { DISTRICTS, REGIONS, CATEGORIES, UNITS } from '../constants';
import { extractSmartFillData, generateItemKeywords } from '../services/geminiService';
import { saveRequest } from '../services/storageService';
import { useLanguage } from '../contexts/LanguageContext';
import { TranslationKey } from '../translations';

export const RequestAidPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [keywordLoaders, setKeywordLoaders] = useState<Record<string, boolean>>({});
  const [naturalInput, setNaturalInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Location State
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  
  const [formData, setFormData] = useState({
    nic: '',
    fullName: '',
    contactNumber: '',
    extraContactNumber: '',
    location: '',
    notes: ''
  });

  const [items, setItems] = useState<AidItem[]>([
    { id: '1', name: '', category: AidCategory.FOOD, quantityNeeded: 1, quantityReceived: 0, unit: 'units', keywords: [] }
  ]);

  // Sync complex location state to formData for storage
  useEffect(() => {
    if (selectedDistrict && selectedRegion) {
      setFormData(prev => ({ ...prev, location: `${selectedDistrict} - ${selectedRegion}` }));
    } else {
      setFormData(prev => ({ ...prev, location: '' }));
    }
  }, [selectedDistrict, selectedRegion]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Name Validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full Name is required";
      isValid = false;
    }

    // NIC / ID Validation
    const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
    
    if (!formData.nic.trim()) {
      newErrors.nic = "NIC / ID Number is required";
      isValid = false;
    } else if (!nicRegex.test(formData.nic.trim())) {
      newErrors.nic = "Invalid NIC. Must be 12 digits or 9 digits + V/X.";
      isValid = false;
    }

    // Contact Number Validation
    const phoneRegex = /^[\d\+\-\s]{9,}$/;
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = "Contact Number is required";
      isValid = false;
    } else if (!phoneRegex.test(formData.contactNumber)) {
      newErrors.contactNumber = "Please enter a valid phone number (min 9 digits)";
      isValid = false;
    }

    // Extra Contact Number Validation (Optional)
    if (formData.extraContactNumber.trim() && !phoneRegex.test(formData.extraContactNumber)) {
      newErrors.extraContactNumber = "Please enter a valid phone number";
      isValid = false;
    }

    // Location Validation
    if (!selectedDistrict) {
      newErrors.district = "District is required";
      isValid = false;
    }
    if (!selectedRegion) {
      newErrors.region = "Region is required";
      isValid = false;
    }

    // Items Validation
    if (items.length === 0) {
      newErrors.items = "At least one item is required";
      isValid = false;
    }
    
    items.forEach((item, index) => {
      if (!item.name.trim()) {
        newErrors[`item_${item.id}_name`] = "Item name is required";
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dist = e.target.value;
    setSelectedDistrict(dist);
    setSelectedRegion(''); // Reset region when district changes
    
    if (errors.district) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.district;
        return newErrors;
      });
    }
  };

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRegion(e.target.value);
    if (errors.region) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.region;
        return newErrors;
      });
    }
  };

  const handleItemChange = (id: string, field: keyof AidItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    
    if (field === 'name' && errors[`item_${id}_name`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`item_${id}_name`];
        return newErrors;
      });
    }
  };

  const handleGenerateKeywords = async (id: string, name: string, category: string) => {
    if (!name.trim()) return;

    setKeywordLoaders(prev => ({ ...prev, [id]: true }));
    try {
      const keywords = await generateItemKeywords(name, category);
      setItems(currentItems => 
        currentItems.map(item => item.id === id ? { ...item, keywords } : item)
      );
    } catch (error) {
      console.error("Failed to generate keywords", error);
    } finally {
      setKeywordLoaders(prev => ({ ...prev, [id]: false }));
    }
  };

  const removeKeyword = (itemId: string, keywordToRemove: string) => {
    setItems(items.map(item => {
      if (item.id === itemId && item.keywords) {
        return {
          ...item,
          keywords: item.keywords.filter(k => k !== keywordToRemove)
        };
      }
      return item;
    }));
  };

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), name: '', category: AidCategory.OTHER, quantityNeeded: 1, quantityReceived: 0, unit: 'units', keywords: [] }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`item_${id}_name`];
        return newErrors;
      });
    }
  };

  const handleSmartFill = async () => {
    if (!naturalInput.trim()) return;
    setAiLoading(true);
    try {
      // Use the new comprehensive smart fill function
      const result = await extractSmartFillData(naturalInput);
      
      if (result) {
        // 1. Fill Personal Info & Notes
        setFormData(prev => ({
          ...prev,
          fullName: result.fullName || prev.fullName,
          nic: result.nic || prev.nic,
          contactNumber: result.contactNumber || prev.contactNumber,
          notes: result.notes || prev.notes
        }));

        // 2. Fill Location (Smart Match)
        if (result.district) {
          // Find matching district case-insensitively
          const matchedDistrict = DISTRICTS.find(d => d.toLowerCase() === result.district?.toLowerCase());
          if (matchedDistrict) {
            setSelectedDistrict(matchedDistrict);
            
            // If we have a region, try to set it too
            if (result.region) {
               setSelectedRegion(result.region);
            }
          }
        }

        // 3. Fill Items
        if (result.items && result.items.length > 0) {
          const newItems: AidItem[] = result.items.map(e => ({
            id: Math.random().toString(36).substr(2, 9),
            name: e.name,
            category: e.category as AidCategory,
            quantityNeeded: e.quantity || 1,
            quantityReceived: 0,
            unit: e.unit || 'units',
            keywords: e.keywords || []
          }));
          setItems(newItems);
        }

        // Clear related errors
        setErrors({});
      }
    } catch (err) {
      console.error(err);
      alert('Failed to interpret text completely. Partial data may be filled.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const newRequest: AidRequest = {
      id: `req_${Date.now()}`,
      ...formData,
      items,
      status: RequestStatus.PENDING,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    try {
      await saveRequest(newRequest);
      navigate('/status', { state: { nic: formData.nic } });
    } catch (err) {
      alert("There was an error saving your request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('req_title')}</h1>
        <p className="text-slate-500">{t('req_subtitle')}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* AI Smart Fill Section */}
        <div className="bg-indigo-50 p-6 border-b border-indigo-100">
          <div className="flex items-start gap-3">
            <div className="mt-1 text-indigo-600">
               <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-indigo-900 mb-2">{t('ai_title')}</h3>
              <p className="text-sm text-indigo-700 mb-3">
                {t('ai_desc')}
              </p>
              <div className="flex gap-2">
                <textarea
                  value={naturalInput}
                  onChange={(e) => setNaturalInput(e.target.value)}
                  placeholder={t('ai_placeholder')}
                  className="flex-1 bg-white text-slate-900 p-3 text-sm rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[80px]"
                />
              </div>
               <button
                  type="button"
                  onClick={handleSmartFill}
                  disabled={aiLoading || !naturalInput}
                  className="mt-3 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {aiLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-bolt"></i>}
                  {t('btn_autofill')}
                </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          {/* Personal Info */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">{t('sect_personal')}</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('lbl_fullname')} *</label>
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  type="text"
                  className={`bg-white text-slate-900 w-full rounded-lg border p-2.5 focus:ring-2 outline-none transition-colors ${
                    errors.fullName 
                      ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                      : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('lbl_nic')} *</label>
                <input
                  name="nic"
                  value={formData.nic}
                  onChange={handleInputChange}
                  type="text"
                  placeholder="e.g. 200013501678 or 660581758v"
                  className={`bg-white text-slate-900 w-full rounded-lg border p-2.5 focus:ring-2 outline-none transition-colors ${
                    errors.nic 
                      ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                      : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                 {errors.nic && <p className="text-red-500 text-xs mt-1">{errors.nic}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('lbl_contact')} *</label>
                <input
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  type="tel"
                  placeholder="e.g. 077 123 4567"
                  className={`bg-white text-slate-900 w-full rounded-lg border p-2.5 focus:ring-2 outline-none transition-colors ${
                    errors.contactNumber 
                      ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                      : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('lbl_extra_contact')} <span className="text-slate-400 font-normal">{t('lbl_optional')}</span></label>
                <input
                  name="extraContactNumber"
                  value={formData.extraContactNumber}
                  onChange={handleInputChange}
                  type="tel"
                  placeholder="e.g. 011 234 5678"
                  className={`bg-white text-slate-900 w-full rounded-lg border p-2.5 focus:ring-2 outline-none transition-colors ${
                    errors.extraContactNumber 
                      ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                      : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                {errors.extraContactNumber && <p className="text-red-500 text-xs mt-1">{errors.extraContactNumber}</p>}
              </div>
              
              {/* Location Selection Split */}
              <div className="col-span-1 md:col-span-2 grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('lbl_district')} *</label>
                  <select
                    value={selectedDistrict}
                    onChange={handleDistrictChange}
                    className={`bg-white text-slate-900 w-full rounded-lg border p-2.5 focus:ring-2 outline-none transition-colors ${
                      errors.district 
                        ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                        : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  >
                    <option value="">{t('sel_district')}</option>
                    {DISTRICTS.map(dist => (
                      <option key={dist} value={dist}>{t(dist as TranslationKey)}</option>
                    ))}
                  </select>
                  {errors.district && <p className="text-red-500 text-xs mt-1">{errors.district}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('lbl_region')} *</label>
                  <select
                    value={selectedRegion}
                    onChange={handleRegionChange}
                    disabled={!selectedDistrict}
                    className={`bg-white text-slate-900 w-full rounded-lg border p-2.5 focus:ring-2 outline-none transition-colors disabled:opacity-50 disabled:bg-slate-100 ${
                      errors.region 
                        ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                        : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  >
                    <option value="">{t('sel_region')}</option>
                    {selectedDistrict && REGIONS[selectedDistrict]?.map(reg => (
                      <option key={reg} value={reg}>{t(reg as TranslationKey)}</option>
                    ))}
                  </select>
                   {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region}</p>}
                   <p className="text-xs text-slate-500 mt-1">{t('hint_region')}</p>
                </div>
              </div>

            </div>
          </section>

          {/* Items */}
          <section className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-lg font-semibold text-slate-800">{t('sect_items')} *</h3>
              <button
                type="button"
                onClick={addItem}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                <i className="fa-solid fa-plus"></i> {t('btn_add_item')}
              </button>
            </div>
            {errors.items && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{errors.items}</p>}
            
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="bg-slate-50 p-4 rounded-lg border border-slate-100 shadow-sm">
                  <div className="flex flex-col md:flex-row gap-3 items-start md:items-start mb-3">
                    {/* Category - First */}
                    <div className="w-full md:w-40">
                      <label className="block text-xs font-medium text-slate-500 mb-1">{t('lbl_category')}</label>
                      <select
                        value={item.category}
                        onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
                        className="w-full bg-white text-slate-900 rounded border-slate-300 border p-2 text-sm focus:border-blue-500 outline-none"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{t(c as TranslationKey)}</option>)}
                      </select>
                    </div>

                    {/* Item Name - Second */}
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-medium text-slate-500 mb-1">{t('lbl_item_name')}</label>
                      <input
                        value={item.name}
                        onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                        onBlur={() => handleGenerateKeywords(item.id, item.name, item.category)}
                        placeholder="e.g. Rice"
                        className={`bg-white text-slate-900 w-full rounded border p-2 text-sm outline-none ${
                           errors[`item_${item.id}_name`] ? 'border-red-500' : 'border-slate-300 focus:border-blue-500'
                        }`}
                      />
                      {errors[`item_${item.id}_name`] && <p className="text-red-500 text-[10px] mt-1">Required</p>}
                    </div>

                    <div className="w-32">
                       <label className="block text-xs font-medium text-slate-500 mb-1">{t('lbl_qty')}</label>
                       <div className="flex items-center border border-slate-300 rounded bg-white overflow-hidden">
                         <button
                           type="button"
                           onClick={() => handleItemChange(item.id, 'quantityNeeded', Math.max(1, item.quantityNeeded - 1))}
                           className="px-3 py-2 text-slate-600 hover:bg-slate-50 transition-colors border-r border-slate-200"
                         >
                           <i className="fa-solid fa-minus text-xs"></i>
                         </button>
                         <input
                           type="number"
                           min="1"
                           value={item.quantityNeeded}
                           onChange={(e) => handleItemChange(item.id, 'quantityNeeded', parseInt(e.target.value) || 0)}
                           className="w-full text-center bg-white text-slate-900 text-sm focus:outline-none appearance-none"
                         />
                         <button
                           type="button"
                           onClick={() => handleItemChange(item.id, 'quantityNeeded', item.quantityNeeded + 1)}
                           className="px-3 py-2 text-slate-600 hover:bg-slate-50 transition-colors border-l border-slate-200"
                         >
                           <i className="fa-solid fa-plus text-xs"></i>
                         </button>
                       </div>
                    </div>
                     <div className="w-24">
                       <label className="block text-xs font-medium text-slate-500 mb-1">{t('lbl_unit')}</label>
                       <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                        className="w-full bg-white text-slate-900 rounded border-slate-300 border p-2 text-sm focus:border-blue-500 outline-none"
                      >
                        {UNITS.map(u => <option key={u} value={u}>{t(u as TranslationKey)}</option>)}
                      </select>
                    </div>
                    <div className="pt-6">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-400 hover:text-red-600 transition-colors"
                        title="Remove item"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>

                  {/* Keywords Section */}
                  <div className="mt-2 pl-1">
                     <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                          <i className="fa-solid fa-tags"></i> {t('lbl_keywords')}
                        </span>
                        {keywordLoaders[item.id] && <i className="fa-solid fa-circle-notch fa-spin text-xs text-blue-500"></i>}
                        {!keywordLoaders[item.id] && item.keywords && item.keywords.length > 0 && (
                          <button
                             type="button"
                             onClick={() => handleGenerateKeywords(item.id, item.name, item.category)}
                             className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                             title="Reset to default AI keywords"
                          >
                             {t('btn_reset_defaults')}
                          </button>
                        )}
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {item.keywords && item.keywords.length > 0 ? (
                          item.keywords.map((keyword, kIndex) => (
                            <span key={`${item.id}-kw-${kIndex}`} className="inline-flex items-center px-2 py-1 rounded bg-white border border-slate-200 text-xs text-slate-600">
                               {keyword}
                               <button 
                                 type="button"
                                 onClick={() => removeKeyword(item.id, keyword)}
                                 className="ml-1.5 text-slate-400 hover:text-red-500"
                               >
                                 <i className="fa-solid fa-times"></i>
                               </button>
                            </span>
                          ))
                        ) : (
                          !keywordLoaders[item.id] && <span className="text-xs text-slate-400 italic">{t('lbl_item_name')}...</span>
                        )}
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
             <label className="block text-sm font-medium text-slate-700 mb-1">{t('lbl_notes')}</label>
             <textarea
               name="notes"
               value={formData.notes}
               onChange={handleInputChange}
               rows={3}
               className="w-full bg-white text-slate-900 rounded-lg border-slate-300 border p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
               placeholder={t('lbl_notes') + "..."}
             />
          </section>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>{t('btn_processing')}</>
              ) : (
                <>{t('btn_submit')} <i className="fa-solid fa-paper-plane"></i></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
