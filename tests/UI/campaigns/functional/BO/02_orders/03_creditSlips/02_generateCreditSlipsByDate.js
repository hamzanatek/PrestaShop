require('module-alias/register');
// Using chai
const {expect} = require('chai');
const helper = require('@utils/helpers');
const loginCommon = require('@commonTests/loginBO');
const files = require('@utils/files');

// Importing pages
const LoginPage = require('@pages/BO/login');
const DashboardPage = require('@pages/BO/dashboard');
const FOBasePage = require('@pages/FO/FObasePage');
const HomePage = require('@pages/FO/home');
const FOLoginPage = require('@pages/FO/login');
const ProductPage = require('@pages/FO/product');
const CartPage = require('@pages/FO/cart');
const CheckoutPage = require('@pages/FO/checkout');
const OrderConfirmationPage = require('@pages/FO/checkout/orderConfirmation');
const OrdersPage = require('@pages/BO/orders/index');
const ViewOrderPage = require('@pages/BO/orders/view');
const CreditSlipsPage = require('@pages/BO/orders/creditSlips/index');

// Importing data
const {PaymentMethods} = require('@data/demo/paymentMethods');
const {DefaultAccount} = require('@data/demo/customer');
const {Statuses} = require('@data/demo/orderStatuses');

// Importing test context
const testContext = require('@utils/testContext');

const baseContext = 'functional_BO_orders_creditSlips_generateCreditSlipByDate';


let browserContext;
let page;

// Get today date
const today = new Date();

// Create a future date that there is no credit slips (yyy-mm-dd)
today.setFullYear(today.getFullYear() + 1);
const futureDate = today.toISOString().slice(0, 10);

const creditSlipDocumentName = 'Credit slip';

// Init objects needed
const init = async function () {
  return {
    loginPage: new LoginPage(page),
    dashboardPage: new DashboardPage(page),
    foBasePage: new FOBasePage(page),
    homePage: new HomePage(page),
    foLoginPage: new FOLoginPage(page),
    productPage: new ProductPage(page),
    cartPage: new CartPage(page),
    checkoutPage: new CheckoutPage(page),
    orderConfirmationPage: new OrderConfirmationPage(page),
    ordersPage: new OrdersPage(page),
    viewOrderPage: new ViewOrderPage(page),
    creditSlipsPage: new CreditSlipsPage(page),
  };
};

/*
Create order
Create credit slip
Generate credit slip file by date
 */
describe('Generate Credit slip file by date', async () => {
  // before and after functions
  before(async function () {
    browserContext = await helper.createBrowserContext(this.browser);
    page = await helper.newTab(browserContext);

    this.pageObjects = await init();
  });
  after(async () => {
    await helper.closeBrowserContext(browserContext);
  });

  describe('Create order in FO', async () => {
    it('should go to FO page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToFO', baseContext);

      // Go to FO and change language
      await this.pageObjects.homePage.goToFo();

      await this.pageObjects.homePage.changeLanguage('en');

      const isHomePage = await this.pageObjects.homePage.isHomePage();
      await expect(isHomePage, 'Fail to open FO home page').to.be.true;
    });

    it('should go to login page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToLoginPageFO', baseContext);

      await this.pageObjects.homePage.goToLoginPage();
      const pageTitle = await this.pageObjects.foLoginPage.getPageTitle();
      await expect(pageTitle, 'Fail to open FO login page').to.contains(this.pageObjects.foLoginPage.pageTitle);
    });

    it('should sign in with default customer', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'sighInFO', baseContext);

      await this.pageObjects.foLoginPage.customerLogin(DefaultAccount);
      const isCustomerConnected = await this.pageObjects.foLoginPage.isCustomerConnected();
      await expect(isCustomerConnected, 'Customer is not connected').to.be.true;
    });

    it('should create an order', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'createOrder', baseContext);

      // Go to home page
      await this.pageObjects.foLoginPage.goToHomePage();

      // Go to the first product page
      await this.pageObjects.homePage.goToProductPage(1);

      // Add the created product to the cart
      await this.pageObjects.productPage.addProductToTheCart();

      // Edit the product quantity
      await this.pageObjects.cartPage.editProductQuantity(1, 5);

      // Proceed to checkout the shopping cart
      await this.pageObjects.cartPage.clickOnProceedToCheckout();

      // Address step - Go to delivery step
      const isStepAddressComplete = await this.pageObjects.checkoutPage.goToDeliveryStep();
      await expect(isStepAddressComplete, 'Step Address is not complete').to.be.true;

      // Delivery step - Go to payment step
      const isStepDeliveryComplete = await this.pageObjects.checkoutPage.goToPaymentStep();
      await expect(isStepDeliveryComplete, 'Step Address is not complete').to.be.true;

      // Payment step - Choose payment step
      await this.pageObjects.checkoutPage.choosePaymentAndOrder(PaymentMethods.wirePayment.moduleName);

      // Check the confirmation message
      const cardTitle = await this.pageObjects.orderConfirmationPage.getOrderConfirmationCardTitle();
      await expect(cardTitle).to.contains(this.pageObjects.orderConfirmationPage.orderConfirmationCardTitle);
    });

    it('should sign out from FO', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'sighOutFO', baseContext);

      await this.pageObjects.orderConfirmationPage.logout();
      const isCustomerConnected = await this.pageObjects.orderConfirmationPage.isCustomerConnected();
      await expect(isCustomerConnected, 'Customer is connected').to.be.false;
    });
  });

  describe('Create Credit slip ', async () => {
    // Login into BO
    loginCommon.loginBO();

    it('should go to the orders page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToOrdersPage', baseContext);

      await this.pageObjects.dashboardPage.goToSubMenu(
        this.pageObjects.dashboardPage.ordersParentLink,
        this.pageObjects.dashboardPage.ordersLink,
      );

      const pageTitle = await this.pageObjects.ordersPage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.ordersPage.pageTitle);
    });

    it('should go to the created order page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToCreatedOrderPage', baseContext);

      await this.pageObjects.ordersPage.goToOrder(1);
      const pageTitle = await this.pageObjects.viewOrderPage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.viewOrderPage.pageTitle);
    });

    it(`should change the order status to '${Statuses.shipped.status}' and check it`, async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'updateCreatedOrderStatus', baseContext);

      const result = await this.pageObjects.viewOrderPage.modifyOrderStatus(Statuses.shipped.status);
      await expect(result).to.equal(Statuses.shipped.status);
    });

    it('should add a partial refund', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'addPartialRefund', baseContext);

      await this.pageObjects.viewOrderPage.clickOnPartialRefund();
      const textMessage = await this.pageObjects.viewOrderPage.addPartialRefundProduct(1, 1);
      await expect(textMessage).to.contains(this.pageObjects.viewOrderPage.partialRefundValidationMessage);
    });

    it('should check the existence of the Credit slip document', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'checkCreditSlipDocumentName', baseContext);

      const documentName = await this.pageObjects.viewOrderPage.getDocumentName(4);
      await expect(documentName).to.be.equal(creditSlipDocumentName);
    });
  });

  describe('Generate Credit slip file by date', async () => {
    it('should go to Credit slips page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToCreditSlipsPage', baseContext);

      await this.pageObjects.viewOrderPage.goToSubMenu(
        this.pageObjects.viewOrderPage.ordersParentLink,
        this.pageObjects.viewOrderPage.creditSlipsLink,
      );

      await this.pageObjects.creditSlipsPage.closeSfToolBar();

      const pageTitle = await this.pageObjects.creditSlipsPage.getPageTitle();
      await expect(pageTitle).to.contains(this.pageObjects.creditSlipsPage.pageTitle);
    });

    it('should generate PDF file by date and check the file existence', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'generatePdfFileExistence', baseContext);

      // Generate credit slip
      const filePath = await this.pageObjects.creditSlipsPage.generatePDFByDateAndDownload();

      const exist = await files.doesFileExist(filePath);
      await expect(exist).to.be.true;
    });

    it('should check the error message when there is no credit slip in the entered date', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'checkErrorMessageNonexistentCreditSlip', baseContext);

      // Generate credit slip and get error message
      const textMessage = await this.pageObjects.creditSlipsPage.generatePDFByDateAndFail(futureDate, futureDate);

      await expect(textMessage).to.equal(this.pageObjects.creditSlipsPage.errorMessageWhenGenerateFileByDate);
    });
  });
});
