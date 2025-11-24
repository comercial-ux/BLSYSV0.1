import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';

const PcLayout = ({ children, title }) => {
    return (
        <>
            <Helmet>
                <title>{title} | Almoxarifado BL</title>
                <meta name="description" content={`Portal de Almoxarifado - ${title}`} />
            </Helmet>
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white flex flex-col items-center justify-center p-4">
                <motion.main
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full"
                >
                    {children}
                </motion.main>
            </div>
        </>
    );
};

export default PcLayout;