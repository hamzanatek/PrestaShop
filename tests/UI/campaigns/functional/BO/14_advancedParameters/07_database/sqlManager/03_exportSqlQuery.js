/**
 * Copyright since 2007 PrestaShop SA and Contributors
 * PrestaShop is an International Registered Trademark & Property of PrestaShop SA
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.md.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/OSL-3.0
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@prestashop.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade PrestaShop to newer
 * versions in the future. If you wish to customize PrestaShop for your
 * needs please refer to https://devdocs.prestashop.com/ for more information.
 *
 * @author    PrestaShop SA and Contributors <contact@prestashop.com>
 * @copyright Since 2007 PrestaShop SA and Contributors
 * @license   https://opensource.org/licenses/OSL-3.0 Open Software License (OSL 3.0)
 */
require('module-alias/register');

const {expect} = require('chai');

// Import utils
const helper = require('@utils/helpers');
const files = require('@utils/files');
const loginCommon = require('@commonTests/loginBO');

// Import pages
const LoginPage = require('@pages/BO/login');
const DashboardPage = require('@pages/BO/dashboard');
const SqlManagerPage = require('@pages/BO/advancedParameters/database/sqlManager');
const AddSqlQueryPage = require('@pages/BO/advancedParameters/database/sqlManager/add');
const ViewQueryManagerPage = require('@pages/BO/advancedParameters/database/sqlManager/view');

// Import pages
const SQLQueryFaker = require('@data/faker/sqlQuery');
const {Tables} = require('@data/demo/sqlTables');

// Import test context
const testContext = require('@utils/testContext');

const baseContext = 'functional_BO_advancedParams_database_sqlManager_exportSqlQuery';

let browserContext;
let page;
let filePath;

let numberOfSQLQueries = 0;

const sqlQueryData = new SQLQueryFaker({tableName: 'ps_alias'});
const fileContent = `${Tables.ps_alias.columns[1]};${Tables.ps_alias.columns[2]};${Tables.ps_alias.columns[3]}`;

// Init objects needed
const init = async function () {
  return {
    loginPage: new LoginPage(page),
    dashboardPage: new DashboardPage(page),
    sqlManagerPage: new SqlManagerPage(page),
    addSqlQueryPage: new AddSqlQueryPage(page),
    viewQueryManagerPage: new ViewQueryManagerPage(page),
  };
};

describe('Export SQL query', async () => {
  // before and after functions
  before(async function () {
    browserContext = await helper.createBrowserContext(this.browser);
    page = await helper.newTab(browserContext);

    this.pageObjects = await init();
  });

  after(async () => {
    await helper.closeBrowserContext(browserContext);
  });

  // Login into BO
  loginCommon.loginBO();

  // Go to database page
  it('should go to \'Advanced Parameters > Database\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToDatabasePageToCreateNewSQLQuery', baseContext);

    await this.pageObjects.dashboardPage.goToSubMenu(
      this.pageObjects.dashboardPage.advancedParametersLink,
      this.pageObjects.dashboardPage.databaseLink,
    );

    await this.pageObjects.dashboardPage.closeSfToolBar();

    const pageTitle = await this.pageObjects.sqlManagerPage.getPageTitle();
    await expect(pageTitle).to.contains(this.pageObjects.sqlManagerPage.pageTitle);
  });

  it('should reset all filters', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'firstResetFilter', baseContext);

    numberOfSQLQueries = await this.pageObjects.sqlManagerPage.resetAndGetNumberOfLines();
    if (numberOfSQLQueries !== 0) {
      await expect(numberOfSQLQueries).to.be.above(0);
    }
  });

  describe('Create new SQL query', async () => {
    it('should go to \'New SQL query\' page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToNewSQLQueryPage', baseContext);

      await this.pageObjects.sqlManagerPage.goToNewSQLQueryPage();
      const pageTitle = await this.pageObjects.addSqlQueryPage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.addSqlQueryPage.pageTitle);
    });

    it('should create new SQL query', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'createNewSQLQuery', baseContext);

      const textResult = await this.pageObjects.addSqlQueryPage.createEditSQLQuery(sqlQueryData);
      await expect(textResult).to.equal(this.pageObjects.addSqlQueryPage.successfulCreationMessage);
    });
  });

  describe('Export SQL query', async () => {
    it('should export sql query to a csv file', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'exportSqlQuery', baseContext);

      filePath = await this.pageObjects.sqlManagerPage.exportSqlResultDataToCsv();

      const doesFileExist = await files.doesFileExist(filePath, 5000);
      await expect(doesFileExist, 'Export of data has failed').to.be.true;
    });

    it('should check existence of query result data in csv file', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'checkSqlQueryInCsvFile', baseContext);

      const numberOfQuery = await this.pageObjects.sqlManagerPage.getNumberOfElementInGrid();

      for (let row = 1; row <= numberOfQuery; row++) {
        const textExist = await files.isTextInFile(filePath, fileContent, true, true);
        await expect(textExist, `${fileContent} was not found in the file`).to.be.true;
      }
    });
  });

  describe('Delete SQL query', async () => {
    it('should filter list by name', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'filterToDeleteSQLQuery', baseContext);

      await this.pageObjects.sqlManagerPage.resetFilter();

      await this.pageObjects.sqlManagerPage.filterSQLQuery('name', sqlQueryData.name);

      const sqlQueryName = await this.pageObjects.sqlManagerPage.getTextColumnFromTable(1, 'name');
      await expect(sqlQueryName).to.contains(sqlQueryData.name);
    });

    it('should delete SQL query', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'deleteSQLQuery', baseContext);

      const textResult = await this.pageObjects.sqlManagerPage.deleteSQLQuery(1);
      await expect(textResult).to.equal(this.pageObjects.sqlManagerPage.successfulDeleteMessage);

      const numberOfSQLQueriesAfterDelete = await this.pageObjects.sqlManagerPage.resetAndGetNumberOfLines();
      await expect(numberOfSQLQueriesAfterDelete).to.be.equal(numberOfSQLQueries);
    });
  });
});
