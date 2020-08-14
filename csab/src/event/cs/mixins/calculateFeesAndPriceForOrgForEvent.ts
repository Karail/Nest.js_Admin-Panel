
import * as crypto from 'crypto';
import Fee from 'src/wallets/cs/models/fee.model';

export const calculateFeesAndPriceForOrgForEvent = async (priceOwner: number, feeObjects?: {
  clicksportFeeObj: Fee,
  ownersPartnerFeeObj: Fee,
  paymentSystemFeeObj: Fee
}) => {    
    // Fees objs 

    if(!feeObjects) {
      feeObjects = {
        clicksportFeeObj: await Fee.findOne({ where: { name: 'clicksport'} }),
        ownersPartnerFeeObj: await Fee.findOne({ where: { name: 'owner partner'} }),
        paymentSystemFeeObj: await Fee.findOne({ where: { name: 'payment system'} })
      };
    }

    // In percents

    const clicksportFeePercent = feeObjects.clicksportFeeObj.percent || 10;
    const ownersPartnerFeePercent = feeObjects.ownersPartnerFeeObj.percent || 10;
    const paymentSystemFeePercent = feeObjects.paymentSystemFeeObj.percent || 8;

    // In currency
    
    let clicksportFee = (priceOwner / 100) * clicksportFeePercent;
    const ownersPartnerFee = (priceOwner / 100) * ownersPartnerFeePercent;
    let priceForOrg = priceOwner + clicksportFee + ownersPartnerFee;

    const paymentSystemFee = priceForOrg / (100 - paymentSystemFeePercent) * paymentSystemFeePercent;
    
    priceForOrg += paymentSystemFee;

    const priceForOrgFraction = priceForOrg % 1;
    if(priceForOrgFraction) {
      const amount = 1 - priceForOrgFraction;
      clicksportFee += amount;
      priceForOrg = Math.ceil(priceForOrg);
    }
    
    const feesAmount = clicksportFee + ownersPartnerFee + paymentSystemFee;

    let hashData = '|';
    for(const key in feeObjects)
      hashData += (<Fee>(<any>feeObjects)[key]).percent + '|';

    const feesHash = crypto.createHash('md5').update(hashData).digest().readUInt32BE(0);

    return {
        feesAmount,
        priceForOrg,
        clicksportFee,
        ownersPartnerFee,
        paymentSystemFee,
        feesHash
    }
}
export default calculateFeesAndPriceForOrgForEvent;