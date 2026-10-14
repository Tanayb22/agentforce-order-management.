public with sharing class App_OrderController {

    /**
     * Retrieves all Accounts for the dashboard dropdown selector.
     */
    @AuraEnabled(cacheable=true)
    public static List<Account> getAccounts() {
        return [
            SELECT Id, Name 
            FROM Account 
            WITH USER_MODE 
            ORDER BY Name ASC 
            LIMIT 50
        ];
    }

    /**
     * Retrieves the latest 10 orders for a given Account ID.
     */
    @AuraEnabled(cacheable=true)
    public static List<App_Order__c> getCustomerOrders(Id accountId) {
        if (accountId == null) {
            return new List<App_Order__c>();
        }

        return [
            SELECT Id, Name, App_Order_Number__c, App_Status__c, App_Total_Amount__c, App_Delivery_Date__c
            FROM App_Order__c
            WHERE Account__c = :accountId
            WITH USER_MODE
            ORDER BY CreatedDate DESC
            LIMIT 10
        ];
    }

    /**
     * Creates a support case linked to a specific order.
     */
    @AuraEnabled
    public static String createSupportCase(Id orderId, String subject, String description) {
        if (orderId == null || String.isBlank(subject)) {
            throw new AuraHandledException('Order ID and Subject are required fields.');
        }

        try {
            Case newCase = new Case(
                App_Order__c = orderId,
                Subject = subject,
                Description = description,
                Origin = 'Web',
                Status = 'New'
            );

            Database.SaveResult sr = Database.insert(newCase, AccessLevel.USER_MODE);
            
            if (sr.isSuccess()) {
                return sr.getId();
            } else {
                throw new AuraHandledException('Failed to create case: ' + sr.getErrors()[0].getMessage());
            }
        } catch (Exception e) {
            throw new AuraHandledException('Error processing request: ' + e.getMessage());
        }
    }
}