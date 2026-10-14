@isTest
private class App_OrderControllerTest {

    @testSetup
    static void setupTestData() {
        Account testAccount = new Account(Name = 'Test Enterprise Corp');
        insert testAccount;

        App_Order__c testOrder = new App_Order__c(
            Account__c = testAccount.Id,
            App_Status__c = 'Shipped',
            App_Total_Amount__c = 450.00,
            App_Delivery_Date__c = Date.today().addDays(2)
        );
        insert testOrder;
    }

    @isTest
    static void testGetCustomerOrders() {
        Account acc = [SELECT Id FROM Account LIMIT 1];

        Test.startTest();
        List<App_Order__c> orders = App_OrderController.getCustomerOrders(acc.Id);
        Test.stopTest();

        System.assert(orders.size() > 0, 'Orders should be retrieved successfully.');
        System.assertEquals('Shipped', orders[0].App_Status__c, 'Order status should match.');
    }

    @isTest
    static void testCreateSupportCase() {
        App_Order__c order = [SELECT Id FROM App_Order__c LIMIT 1];

        Test.startTest();
        String caseId = App_OrderController.createSupportCase(
            order.Id, 
            'Damaged Item Received', 
            'The item box was torn and contents broken.'
        );
        Test.stopTest();

        System.assertNotEquals(null, caseId, 'Case ID should be generated upon successful insert.');
        
        Case insertedCase = [SELECT Id, Subject, App_Order__c FROM Case WHERE Id = :caseId];System.assertEquals('Damaged Item Received', insertedCase.Subject, 'Case subject should match.');
        System.assertEquals(order.Id, insertedCase.App_Order__c, 'Case should be linked to the correct order.');
    }
}