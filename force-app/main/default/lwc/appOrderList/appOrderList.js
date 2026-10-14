import { LightningElement, wire } from 'lwc';
import getAppOrders from '@salesforce/apex/AppOrderController.getAppOrders';

const COLUMNS = [
    { label: 'Order Number', fieldName: 'App_Order_Number__c' },
    { label: 'Status', fieldName: 'App_Status__c' },
    { label: 'Delivery Date', fieldName: 'App_Delivery_Date__c', type: 'date' }
];

export default class AppOrderList extends LightningElement {
    columns = COLUMNS;
    @wire(getAppOrders) orders;
}