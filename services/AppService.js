import appInstance from '../app';

// Wait for services to be initialized
let driver = null;
let cronFunc = null;

const initializeServices = async () => {
    if (!driver || !cronFunc) {
        await appInstance.initialize();
        driver = appInstance.services.driver;
        cronFunc = appInstance.services.cronService;
    }
    return { driver, cronFunc };
};

export { initializeServices, driver, cronFunc };