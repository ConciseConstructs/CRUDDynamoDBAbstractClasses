import { LambdaHandler } from '../lambdahandler/LambdaHandler.class'
import { IResponse } from '../lambdahandler/Response.class'
import { Context, Callback } from 'aws-lambda'


  export interface IRequest {
    accountId:string
    id:string
  }


export abstract class DeleteHandler extends LambdaHandler {
    protected request:IRequest
    protected response:IResponse
    protected record:any
    protected unlinkRecordPromises:Promise<any>[]



    constructor(incomingRequest:IRequest, context:Context, callback:Callback) {
      super(incomingRequest, context, callback)
    }



        protected hookConstructorPre() {
          this.requiredInputs = ['accountId', 'id']
          this.needsToConnectToDatabase = true
          this.needsToExecuteLambdas = true
        }







    protected async performActions() {
      await this.getRecordForExamination()
      this.examineLinksForUnlinking()
      Promise.all([
        this.unlinkRecordPromises,
        this.db.delete(this.makeDeleteSyntax()).promise()
      ])
        .then(result => this.hasSucceeded(result))
        .catch(error => this.hasFailed(error))
    }




        protected getRecordForExamination() {
          return this.lambda.invoke({
            FunctionName: `${ process.env.saasName }-${ process.env.model }-${ process.env.stage }-read-isExactly`,
            Payload: JSON.stringify({
              accountId: this.request.accountId,
              value: this.request.id
            })
          }).promise()
            .then(result => this.onGetRecordSuccess(result))
            .catch(error => this.onGetRecordFailure(error))
        }




            protected onGetRecordFailure(error) {  console.log('error-8fe713e6-48e5-44fd-b0ac-a3b8ebcaaf26', error)
              this.hasFailed(error)
            }




            protected onGetRecordSuccess(result) {
              let payload = JSON.parse(result.Payload)
              this.record = JSON.parse(payload.body).details.Items[0]
            }




        protected examineLinksForUnlinking() {
          if (!this.record.links) return
          this.unlinkRecordPromises = [ ]
          for (let [ table, ids ] of Object.entries(this.record.links) as any) {
            if (Object.keys(ids).length === 0) continue
            else Object.keys(ids).forEach(id => this.unlinkRecordPromises.push(this.requestUnlinking(table, id)))
          }
        }




            protected requestUnlinking(table, id) {
              return this.lambda.invoke({
                FunctionName: `Database-${ process.env.stage }-unlink`,
                Payload: JSON.stringify({
                  accountId: this.request.accountId,
                  table: table,
                  id: id,
                  foreignTable: process.env.model,
                  foreignId: this.request.id
                })
              }).promise()
            }




        protected makeDeleteSyntax() {
          return {
            TableName: `${ process.env.saasName }-${ process.env.stage }`,
            Key: {
              table: `${ this.request.accountId }.${ process.env.model }`,
              id: this.request.id
            }
          }
        }

} // End Main Handler Function -------
