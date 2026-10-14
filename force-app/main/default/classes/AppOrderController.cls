public with sharing class AppOrderController {
    @AuraEnabled(cacheable=true)
    public static List<App_Order__c> getAppOrders() {
        return [
            SELECT Id, Name, App_Order_Number__c, App_Status__c, App_Delivery_Date__c
            FROM App_Order__c
            ORDER BY CreatedDate DESC
            LIMIT 10
        ];
    }
}