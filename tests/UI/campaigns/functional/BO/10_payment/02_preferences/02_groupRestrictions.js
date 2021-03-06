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
const testContext = require('@utils/testContext');

const baseContext = 'functional_BO_payment_preferences_groupRestrictions';

const {expect} = require('chai');
const helper = require('@utils/helpers');
const loginCommon = require('@commonTests/loginBO');

// Importing pages
const LoginPage = require('@pages/BO/login');
const DashboardPage = require('@pages/BO/dashboard');
const CustomersPage = require('@pages/BO/customers');
const AddCustomerPage = require('@pages/BO/customers/add');
const PreferencesPage = require('@pages/BO/payment/preferences');
const ProductPage = require('@pages/FO/product');
const FOBasePage = require('@pages/FO/FObasePage');
const HomePage = require('@pages/FO/home');
const CartPage = require('@pages/FO/cart');
const CheckoutPage = require('@pages/FO/checkout');

// Importing data
const {DefaultAccount} = require('@data/demo/customer');
const AddressData = require('@data/faker/address');
const CustomerFaker = require('@data/faker/customer');

let browserContext;
let page;

let numberOfCustomers = 0;

// Init data
const address = new AddressData({city: 'Paris', country: 'France'});
const visitorData = new CustomerFaker({defaultCustomerGroup: 'Visitor'});
const guestData = new CustomerFaker({defaultCustomerGroup: 'Guest'});

// Init objects needed
const init = async function () {
  return {
    loginPage: new LoginPage(page),
    dashboardPage: new DashboardPage(page),
    customersPage: new CustomersPage(page),
    addCustomerPage: new AddCustomerPage(page),
    preferencesPage: new PreferencesPage(page),
    productPage: new ProductPage(page),
    foBasePage: new FOBasePage(page),
    homePage: new HomePage(page),
    cartPage: new CartPage(page),
    checkoutPage: new CheckoutPage(page),
  };
};

describe('Configure group restrictions', async () => {
  // before and after functions
  before(async function () {
    browserContext = await helper.createBrowserContext(this.browser);
    page = await helper.newTab(browserContext);

    this.pageObjects = await init();
  });

  after(async () => {
    await helper.closeBrowserContext(browserContext);
  });
  // Login into BO and go to Payment > Preferences page
  loginCommon.loginBO();

  describe('Create two customers in visitor and guest groups', async () => {
    it('should go to \'Customers > Customers\' page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToCustomersPageToCreate', baseContext);

      await this.pageObjects.dashboardPage.goToSubMenu(
        this.pageObjects.dashboardPage.customersParentLink,
        this.pageObjects.dashboardPage.customersLink,
      );

      await this.pageObjects.customersPage.closeSfToolBar();

      const pageTitle = await this.pageObjects.customersPage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.customersPage.pageTitle);
    });

    it('should reset all filters', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'resetBeforeCreate', baseContext);

      numberOfCustomers = await this.pageObjects.customersPage.resetAndGetNumberOfLines();
      await expect(numberOfCustomers).to.be.above(0);
    });


    const customers = [
      {args: {customerData: visitorData}},
      {args: {customerData: guestData}},
    ];


    customers.forEach((test, index) => {
      it('should go to add new customer page', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `goToAddNewCustomerPage${index}`, baseContext);

        await this.pageObjects.customersPage.goToAddNewCustomerPage();
        const pageTitle = await this.pageObjects.addCustomerPage.getPageTitle();
        await expect(pageTitle).to.contains(this.pageObjects.addCustomerPage.pageTitleCreate);
      });

      it('should create customer and check result', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `createCustomer${index}`, baseContext);

        // Create customer
        const textResult = await this.pageObjects.addCustomerPage.createEditCustomer(test.args.customerData);
        await expect(textResult).to.equal(this.pageObjects.customersPage.successfulCreationMessage);

        // Check number of customers
        const numberOfCustomersAfterCreation = await this.pageObjects.customersPage.getNumberOfElementInGrid();
        await expect(numberOfCustomersAfterCreation).to.be.equal(numberOfCustomers + index + 1);
      });
    });
  });

  describe('Configure group restrictions and check in FO', async () => {
    it('should go to \'Payment > Preferences\' page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToPreferencesPage', baseContext);

      await this.pageObjects.customersPage.goToSubMenu(
        this.pageObjects.customersPage.paymentParentLink,
        this.pageObjects.customersPage.preferencesLink,
      );

      const pageTitle = await this.pageObjects.preferencesPage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.preferencesPage.pageTitle);
    });


    const groups = [
      {args: {groupName: 'Visitor', id: 0, customer: visitorData}},
      {args: {groupName: 'Guest', id: 1, customer: guestData}},
      {args: {groupName: 'Customer', id: 2, customer: DefaultAccount}},
    ];


    groups.forEach((group, groupIndex) => {
      describe(`Configure '${group.args.groupName}' group restrictions then check in FO`, async () => {
        const tests = [
          {
            args: {
              action: 'uncheck',
              paymentModuleToEdit: 'ps_wirepayment',
              defaultPaymentModule: 'ps_checkpayment',
              check: false,
              wirePaymentExist: false,
              checkPaymentExist: true,
            },
          },
          {
            args: {
              action: 'uncheck',
              paymentModuleToEdit: 'ps_checkpayment',
              defaultPaymentModule: 'ps_wirepayment',
              check: false,
              wirePaymentExist: false,
              checkPaymentExist: false,
            },
          },
          {
            args: {
              action: 'check',
              paymentModuleToEdit: 'ps_wirepayment',
              defaultPaymentModule: 'ps_checkpayment',
              check: true,
              wirePaymentExist: true,
              checkPaymentExist: false,
            },
          },
          {
            args: {
              action: 'check',
              paymentModuleToEdit: 'ps_checkpayment',
              defaultPaymentModule: 'ps_wirepayment',
              check: true,
              wirePaymentExist: true,
              checkPaymentExist: true,
            },
          },
        ];

        tests.forEach((test, index) => {
          it(`should ${test.args.action} '${test.args.paymentModuleToEdit}'`, async function () {
            await testContext.addContextItem(
              this,
              'testIdentifier',
              `${test.args.action}_${test.args.paymentModuleToEdit}From${group.args.groupName}Group`,
              baseContext,
            );

            const result = await this.pageObjects.preferencesPage.setGroupRestrictions(
              group.args.id,
              test.args.paymentModuleToEdit,
              test.args.check,
            );

            await expect(result).to.contains(this.pageObjects.preferencesPage.successfulUpdateMessage);
          });

          it('should go to FO and add the first product to the cart', async function () {
            await testContext.addContextItem(
              this,
              'testIdentifier',
              `addFirstProductToCart${index}${groupIndex}`,
              baseContext,
            );

            // Click on view my shop
            page = await this.pageObjects.preferencesPage.viewMyShop();
            this.pageObjects = await init();

            // Logout if already login
            if (index === 0 && groupIndex !== 0) {
              await this.pageObjects.foBasePage.logout();
            }

            // Change FO language
            await this.pageObjects.foBasePage.changeLanguage('en');

            // Go to the first product page
            await this.pageObjects.homePage.goToProductPage(1);

            // Add the product to the cart
            await this.pageObjects.productPage.addProductToTheCart();

            // Proceed to checkout the shopping cart
            await this.pageObjects.cartPage.clickOnProceedToCheckout();

            const isCheckoutPage = await this.pageObjects.checkoutPage.isCheckoutPage();
            await expect(isCheckoutPage).to.be.true;
          });

          // Personal information step - Login
          if (index === 0) {
            it('should login and go to address step', async function () {
              await testContext.addContextItem(
                this,
                'testIdentifier',
                `loginToFO${index}${groupIndex}`,
                baseContext,
              );

              await this.pageObjects.checkoutPage.clickOnSignIn();
              const isStepLoginComplete = await this.pageObjects.checkoutPage.customerLogin(group.args.customer);
              await expect(isStepLoginComplete, 'Step Personal information is not complete').to.be.true;
            });
          }

          // Address step - Add address
          if (group.args.groupName !== 'Customer' && index === 0) {
            it('should create address then continue to delivery step', async function () {
              await testContext.addContextItem(
                this,
                'testIdentifier',
                `createAddress${index}${groupIndex}`,
                baseContext,
              );

              const isStepAddressComplete = await this.pageObjects.checkoutPage.setAddress(address);
              await expect(isStepAddressComplete, 'Step Address is not complete').to.be.true;
            });
          }

          // Address step - Go to delivery step
          if (group.args.groupName === 'Customer' || index !== 0) {
            it('should continue to delivery step', async function () {
              await testContext.addContextItem(
                this,
                'testIdentifier',
                `goToDeliveryStep${index}${groupIndex}`,
                baseContext,
              );

              const isStepAddressComplete = await this.pageObjects.checkoutPage.goToDeliveryStep();
              await expect(isStepAddressComplete, 'Step Address is not complete').to.be.true;
            });
          }

          // Delivery step - Go to payment step and check payment module

          it('should continue to payment step and check the existence of payment method', async function () {
            await testContext.addContextItem(
              this,
              'testIdentifier',
              `goToPaymentStep${index}${groupIndex}`,
              baseContext,
            );

            // Go to payment step
            const isStepDeliveryComplete = await this.pageObjects.checkoutPage.goToPaymentStep();
            await expect(isStepDeliveryComplete, 'Step Address is not complete').to.be.true;

            // Check wire Payment block
            let isVisible = await this.pageObjects.checkoutPage.isPaymentMethodExist(test.args.paymentModuleToEdit);
            await expect(isVisible).to.be.equal(test.args.wirePaymentExist);

            // Check check Payment block
            isVisible = await this.pageObjects.checkoutPage.isPaymentMethodExist(test.args.defaultPaymentModule);
            await expect(isVisible).to.be.equal(test.args.checkPaymentExist);
          });

          it('should go back to BO', async function () {
            await testContext.addContextItem(this, 'testIdentifier', `goBackToBo${index}${groupIndex}`, baseContext);

            // Close current tab
            page = await this.pageObjects.foBasePage.closePage(browserContext, 0);
            this.pageObjects = await init();

            const pageTitle = await this.pageObjects.preferencesPage.getPageTitle();
            await expect(pageTitle).to.contains(this.pageObjects.preferencesPage.pageTitle);
          });
        });
      });
    });
  });

  describe('Delete the two created customers', async () => {
    it('should go to customers page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToCustomersPageToDelete', baseContext);

      await this.pageObjects.preferencesPage.goToSubMenu(
        this.pageObjects.preferencesPage.customersParentLink,
        this.pageObjects.preferencesPage.customersLink,
      );

      const pageTitle = await this.pageObjects.customersPage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.customersPage.pageTitle);
    });


    const customers = [
      {args: {customerData: visitorData}},
      {args: {customerData: guestData}},
    ];

    customers.forEach((test, index) => {
      it('should filter list by email', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `filterToDelete${index}`, baseContext);

        // Reset before filter
        await this.pageObjects.customersPage.resetFilter();

        await this.pageObjects.customersPage.filterCustomers(
          'input',
          'email',
          test.args.customerData.email,
        );

        const textEmail = await this.pageObjects.customersPage.getTextColumnFromTableCustomers(1, 'email');
        await expect(textEmail).to.contains(test.args.customerData.email);
      });

      it('should delete customer', async function () {
        await testContext.addContextItem(this, 'testIdentifier', `deleteCustomer${index}`, baseContext);

        const textResult = await this.pageObjects.customersPage.deleteCustomer(1);
        await expect(textResult).to.equal(this.pageObjects.customersPage.successfulDeleteMessage);

        // Check number of customers after delete
        const numberOfCustomersAfterDelete = await this.pageObjects.customersPage.resetAndGetNumberOfLines();
        await expect(numberOfCustomersAfterDelete).to.be.equal(numberOfCustomers - index + 1);
      });
    });
  });
});
