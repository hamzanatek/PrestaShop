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
const loginCommon = require('@commonTests/loginBO');

// Import pages
const LoginPage = require('@pages/BO/login');
const DashboardPage = require('@pages/BO/dashboard');
const AddressesPage = require('@pages/BO/customers/addresses');
const AddAddressPage = require('@pages/BO/customers/addresses/add');

// Import data
const AddressFaker = require('@data/faker/address');

// Import test context
const testContext = require('@utils/testContext');

const baseContext = 'functional_BO_customers_addresses_addressesBulkActions';


let browserContext;
let page;
let numberOfAddresses = 0;

const addressData = new AddressFaker({address: 'todelete', email: 'pub@prestashop.com', country: 'France'});

// Init objects needed
const init = async function () {
  return {
    loginPage: new LoginPage(page),
    dashboardPage: new DashboardPage(page),
    addressesPage: new AddressesPage(page),
    addAddressPage: new AddAddressPage(page),
  };
};

// Create addresses then delete with Bulk actions
describe('Create Addresses then delete with Bulk actions', async () => {
  // before and after functions
  before(async function () {
    browserContext = await helper.createBrowserContext(this.browser);
    page = await helper.newTab(browserContext);

    this.pageObjects = await init();
  });

  after(async () => {
    await helper.closeBrowserContext(browserContext);
  });

  // Login into BO and go to addresses page
  loginCommon.loginBO();

  it('should go to \'Customers>Addresses\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToAddressesPage', baseContext);

    await this.pageObjects.dashboardPage.goToSubMenu(
      this.pageObjects.dashboardPage.customersParentLink,
      this.pageObjects.dashboardPage.addressesLink,
    );

    await this.pageObjects.addressesPage.closeSfToolBar();

    const pageTitle = await this.pageObjects.addressesPage.getPageTitle();
    await expect(pageTitle).to.contains(this.pageObjects.addressesPage.pageTitle);
  });

  it('should reset all filters', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'resetFirst', baseContext);

    numberOfAddresses = await this.pageObjects.addressesPage.resetAndGetNumberOfLines();
    await expect(numberOfAddresses).to.be.above(0);
  });

  // 1 : Create 2 addresses in BO
  describe('Create 2 addresses in BO', async () => {
    const tests = [
      {args: {addressToCreate: addressData}},
      {args: {addressToCreate: addressData}},
    ];

    tests.forEach((test, index) => {
      it('should go to add new address page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `goToAddAddressPage${index + 1}`, baseContext);

        await this.pageObjects.addressesPage.goToAddNewAddressPage();
        const pageTitle = await this.pageObjects.addAddressPage.getPageTitle();
        await expect(pageTitle).to.contains(this.pageObjects.addAddressPage.pageTitleCreate);
      });

      it('should create address and check result', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `createAddress${index + 1}`, baseContext);

        const textResult = await this.pageObjects.addAddressPage.createEditAddress(test.args.addressToCreate);
        await expect(textResult).to.equal(this.pageObjects.addressesPage.successfulCreationMessage);

        const numberOfAddressesAfterCreation = await this.pageObjects.addressesPage.getNumberOfElementInGrid();
        await expect(numberOfAddressesAfterCreation).to.be.equal(numberOfAddresses + index + 1);
      });
    });
  });

  // 2 : Delete addresses created with bulk actions
  describe('Delete addresses with Bulk Actions', async () => {
    it('should filter list by address', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'filterToBulkDelete', baseContext);

      await this.pageObjects.addressesPage.resetFilter();

      await this.pageObjects.addressesPage.filterAddresses(
        'input',
        'address1',
        addressData.address,
      );

      const address = await this.pageObjects.addressesPage.getTextColumnFromTableAddresses(1, 'address1');
      await expect(address).to.contains(addressData.address);
    });

    it('should delete addresses with Bulk Actions and check addresses Page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'bulkDeleteAddresses', baseContext);

      const deleteTextResult = await this.pageObjects.addressesPage.deleteAddressesBulkActions();
      await expect(deleteTextResult).to.be.equal(this.pageObjects.addressesPage.successfulDeleteMessage);
    });

    it('should reset all filters', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'resetAfterBulkDelete', baseContext);

      const numberOfAddressesAfterReset = await this.pageObjects.addressesPage.resetAndGetNumberOfLines();
      await expect(numberOfAddressesAfterReset).to.be.equal(numberOfAddresses);
    });
  });
});
