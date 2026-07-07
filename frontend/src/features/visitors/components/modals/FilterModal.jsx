import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Dropdown from '@/components/ui/Dropdown';

const FilterModal = ({ isOpen, onClose, onFilter }) => {
    const { register, handleSubmit, reset, control } = useForm();

    if (!isOpen) return null;

    const onSubmit = (data) => {
        onFilter(data);
        onClose();
    };

    const handleReset = () => {
        reset();
        onFilter({});
        onClose();
    };

    return (
        <div className="absolute top-12 right-0 z-50 bg-white rounded-xl shadow-lg border border-gray-100 p-4 w-72">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-800">Filter Visitors</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                        <input 
                            type="date" 
                            {...register('fromDate')} 
                            className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                        <input 
                            type="date" 
                            {...register('toDate')} 
                            className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                    <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                            <Dropdown 
                                options={[
                                    { value: '', label: 'All' },
                                    { value: 'Inside', label: 'Inside' },
                                    { value: 'Completed', label: 'Completed' }
                                ]}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="All"
                                triggerClassName="w-full px-2 py-1.5 text-sm bg-white border border-gray-200 rounded-lg outline-none"
                            />
                        )}
                    />
                </div>

                <div className="flex justify-between gap-2 mt-2">
                    <Button 
                        type="button" 
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                    >
                        Reset
                    </Button>
                    <Button 
                        type="submit" 
                        size="sm"
                    >
                        Filter
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default FilterModal;
