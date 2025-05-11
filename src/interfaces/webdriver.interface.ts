import { WebDriver } from 'selenium-webdriver';

export interface WebDriverManager {
  getDriver(): Promise<WebDriver>;
  releaseDriver(driver: WebDriver): Promise<void>;
  quitDriver(driver: WebDriver): Promise<void>;
}
