import { LightningElement, api, wire, track } from 'lwc';
import getAccounts from '@salesforce/apex/App_OrderController.getAccounts';
import getCustomerOrders from '@salesforce/apex/App_OrderController.getCustomerOrders';
import createSupportCase from '@salesforce/apex/App_OrderController.createSupportCase';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

const COLUMNS = [
    { label: 'Order Number', fieldName: 'App_Order_Number__c', type: 'text' },
    { label: 'Status', fieldName: 'App_Status__c', type: 'text' },
    { label: 'Total Amount', fieldName: 'App_Total_Amount__c', type: 'currency', typeAttributes: { currencyCode: 'USD' } },
    { label: 'Delivery Date', fieldName: 'App_Delivery_Date__c', type: 'date' },
    {
        type: 'button',
        typeAttributes: {
            label: 'Report Issue',
            name: 'report_issue',
            variant: 'neutral',
            iconName: 'utility:warning'
        }
    }
];

export default class AppOrderTracker extends LightningElement {
    @api recordId; // Set automatically if on an Account Record Page
    @track selectedAccountId = '';
    @track accountOptions = [];
    @track orders = [];
    @track columns = COLUMNS;
    @track isLoading = true;
    @track isModalOpen = false;

    selectedOrderId;
    selectedOrderNumber;
    caseSubject = '';
    caseDescription = '';

    wiredOrdersResult;

    // Fetch Accounts list for Dashboard Dropdown
    @wire(getAccounts)
    wiredAccounts({ data, error }) {
        if (data) {
            this.accountOptions = data.map(acc => ({
                label: acc.Name,
                value: acc.Id
            }));
            
            // Default to the recordId (if on Record Page) or first Account in dropdown
            if (this.recordId) {
                this.selectedAccountId = this.recordId;
            } else if (this.accountOptions.length > 0) {
                this.selectedAccountId = this.accountOptions[0].value;
            }
        } else if (error) {
            this.showToast('Error Loading Accounts', error.body ? error.body.message : 'Unknown error', 'error');
        }
    }

    // Reactively fetch orders based on selectedAccountId
    @wire(getCustomerOrders, { accountId: '$selectedAccountId' })
    wiredOrders(result) {
        this.wiredOrdersResult = result;
        const { data, error } = result;
        this.isLoading = false;

        if (data) {
            this.orders = data;
        } else if (error) {
            this.showToast('Error Loading Orders', error.body ? error.body.message : 'Unknown error', 'error');
        }
    }

    get hasAccountOptions() {
        return this.accountOptions && this.accountOptions.length > 0;
    }

    get hasOrders() {
        return this.orders && this.orders.length > 0;
    }

    get showAccountDropdown() {
        // Show dropdown if on an App/Dashboard page (where recordId is not passed)
        return !this.recordId;
    }

    handleAccountChange(event) {
        this.selectedAccountId = event.detail.value;
        this.isLoading = true;
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        if (actionName === 'report_issue') {
            this.selectedOrderId = row.Id;
            this.selectedOrderNumber = row.App_Order_Number__c;
            this.caseSubject = `Support Needed for Order ${row.App_Order_Number__c}`;
            this.isModalOpen = true;
        }
    }

    handleSubjectChange(event) {
        this.caseSubject = event.target.value;
    }

    handleDescriptionChange(event) {
        this.caseDescription = event.target.value;
    }

    closeModal() {
        this.isModalOpen = false;
        this.caseSubject = '';
        this.caseDescription = '';
    }

    handleSubmitCase() {
        if (!this.caseSubject || !this.caseDescription) {
            this.showToast('Missing Fields', 'Please enter both subject and description.', 'warning');
            return;
        }

        this.isLoading = true;
        createSupportCase({
            orderId: this.selectedOrderId,
            subject: this.caseSubject,
            description: this.caseDescription
        })
        .then((caseId) => {
            this.showToast('Success', `Case created successfully! Case ID: ${caseId}`, 'success');
            this.closeModal();
            return refreshApex(this.wiredOrdersResult);
        })
        .catch((error) => {
            this.showToast('Error Creating Case', error.body ? error.body.message : 'Unknown error', 'error');
        })
        .finally(() => {
            this.isLoading = false;
        });
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}