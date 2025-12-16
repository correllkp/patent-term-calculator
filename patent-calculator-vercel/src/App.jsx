import { useState } from 'react';
import { Calculator, Calendar, AlertCircle, CheckCircle, FileText, ExternalLink, Info } from 'lucide-react';

function App() {
  const [patentType, setPatentType] = useState('utility');
  const [filingDate, setFilingDate] = useState('');
  const [hasDomesticBenefit, setHasDomesticBenefit] = useState(false);
  const [eefd, setEefd] = useState('');
  const [grantDate, setGrantDate] = useState('');
  const [hasTerminalDisclaimer, setHasTerminalDisclaimer] = useState(false);
  const [tdExpirationDate, setTdExpirationDate] = useState('');
  const [results, setResults] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  const calculatePatentTerm = () => {
    if (!filingDate || !grantDate) {
      alert('Please enter both filing date and grant date');
      return;
    }

    const filing = new Date(filingDate);
    const grant = new Date(grantDate);
    const effectiveFilingDate = hasDomesticBenefit && eefd ? new Date(eefd) : filing;
    
    let expirationDate;
    let termBasis = '';
    
    // Calculate based on patent type and filing date
    if (patentType === 'design') {
      // Design patents filed on or after May 13, 2015: 15 years from grant
      // Design patents filed before May 13, 2015: 14 years from grant
      const mayThirteen2015 = new Date('2015-05-13');
      const yearsFromGrant = filing >= mayThirteen2015 ? 15 : 14;
      expirationDate = new Date(grant);
      expirationDate.setFullYear(expirationDate.getFullYear() + yearsFromGrant);
      termBasis = `${yearsFromGrant} years from grant date`;
    } else {
      // Utility and Plant patents
      const june71995 = new Date('1995-06-08');
      
      if (filing >= june71995) {
        // Post-GATT: 20 years from filing (or EEFD if applicable)
        expirationDate = new Date(effectiveFilingDate);
        expirationDate.setFullYear(expirationDate.getFullYear() + 20);
        termBasis = hasDomesticBenefit && eefd ? 
          '20 years from Earliest Effective Filing Date' : 
          '20 years from filing date';
      } else {
        // Pre-GATT: 17 years from grant
        expirationDate = new Date(grant);
        expirationDate.setFullYear(expirationDate.getFullYear() + 17);
        termBasis = '17 years from grant date (pre-GATT)';
      }
    }
    
    // Apply terminal disclaimer if applicable
    if (hasTerminalDisclaimer && tdExpirationDate) {
      const tdDate = new Date(tdExpirationDate);
      if (tdDate < expirationDate) {
        expirationDate = tdDate;
        termBasis += ' (limited by terminal disclaimer)';
      }
    }
    
    // Calculate maintenance fees for utility/plant patents
    let maintenanceFees = null;
    if (patentType !== 'design') {
      maintenanceFees = {
        first: new Date(grant.getFullYear() + 4, grant.getMonth(), grant.getDate()),
        second: new Date(grant.getFullYear() + 8, grant.getMonth(), grant.getDate()),
        third: new Date(grant.getFullYear() + 12, grant.getMonth(), grant.getDate()),
      };
    }
    
    // Calculate days until expiration
    const today = new Date();
    const daysUntilExpiration = Math.floor((expirationDate - today) / (1000 * 60 * 60 * 24));
    const yearsUntilExpiration = (daysUntilExpiration / 365.25).toFixed(1);
    
    setResults({
      expirationDate: expirationDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      termBasis,
      maintenanceFees,
      daysUntilExpiration,
      yearsUntilExpiration,
      isExpired: expirationDate < today
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calculator className="w-12 h-12 text-primary-600" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Patent Term Calculator
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Calculate expiration dates and maintenance fee deadlines for your utility, design, or plant patents
          </p>
        </header>

        {/* Info Banner */}
        <div className="card mb-8 bg-blue-50 border-2 border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">Important Note</h3>
              <p className="text-blue-800 text-sm">
                This calculator provides estimates based on standard patent term rules. For reexaminations or reissues, 
                use the original patent's information. For precise calculations including Patent Term Adjustments (PTA) 
                or Patent Term Extensions (PTE), consult with a{' '}
                <a href="https://patentwerks.ai" target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-blue-600">
                  patent professional
                </a>.
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calculator Form */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary-600" />
                Patent Information
              </h2>

              <div className="space-y-6">
                {/* Patent Type */}
                <div className="input-group">
                  <label className="label">Patent Type *</label>
                  <select 
                    className="input"
                    value={patentType}
                    onChange={(e) => setPatentType(e.target.value)}
                  >
                    <option value="utility">Utility Patent</option>
                    <option value="design">Design Patent</option>
                    <option value="plant">Plant Patent</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {patentType === 'design' && 'Design patents have different term calculations based on filing date'}
                    {patentType === 'utility' && 'Most common type - typically 20 years from filing'}
                    {patentType === 'plant' && 'Plant patents follow utility patent term rules'}
                  </p>
                </div>

                {/* Filing Date */}
                <div className="input-group">
                  <label className="label">Filing Date (U.S. or 371 International Date) *</label>
                  <input 
                    type="date"
                    className="input"
                    value={filingDate}
                    onChange={(e) => setFilingDate(e.target.value)}
                  />
                </div>

                {/* Domestic Benefit */}
                <div className="input-group">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={hasDomesticBenefit}
                      onChange={(e) => setHasDomesticBenefit(e.target.checked)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="label">Claims Domestic Benefit (Continuation, CIP, or Divisional)</span>
                  </label>
                </div>

                {/* EEFD */}
                {hasDomesticBenefit && (
                  <div className="input-group pl-6 border-l-4 border-primary-300">
                    <label className="label">Earliest Effective Filing Date (EEFD)</label>
                    <input 
                      type="date"
                      className="input"
                      value={eefd}
                      onChange={(e) => setEefd(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The filing date of the earliest parent application in the chain
                    </p>
                  </div>
                )}

                {/* Grant Date */}
                <div className="input-group">
                  <label className="label">Grant Date (Issue Date) *</label>
                  <input 
                    type="date"
                    className="input"
                    value={grantDate}
                    onChange={(e) => setGrantDate(e.target.value)}
                  />
                </div>

                {/* Terminal Disclaimer */}
                <div className="input-group">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={hasTerminalDisclaimer}
                      onChange={(e) => setHasTerminalDisclaimer(e.target.checked)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="label">Has Terminal Disclaimer</span>
                  </label>
                </div>

                {/* TD Expiration Date */}
                {hasTerminalDisclaimer && (
                  <div className="input-group pl-6 border-l-4 border-primary-300">
                    <label className="label">Terminal Disclaimer Expiration Date</label>
                    <input 
                      type="date"
                      className="input"
                      value={tdExpirationDate}
                      onChange={(e) => setTdExpirationDate(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The expiration date of the patent to which this patent is terminally disclaimed
                    </p>
                  </div>
                )}

                {/* Calculate Button */}
                <button 
                  onClick={calculatePatentTerm}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Calculator className="w-5 h-5" />
                  Calculate Patent Term
                </button>
              </div>
            </div>

            {/* Results */}
            {results && (
              <div className="mt-8 space-y-6 animate-fade-in">
                {/* Main Result */}
                <div className={`result-card ${results.isExpired ? 'border-red-300 bg-red-50' : ''}`}>
                  <div className="flex items-start gap-3 mb-4">
                    {results.isExpired ? (
                      <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {results.isExpired ? 'Patent Has Expired' : 'Patent Expiration Date'}
                      </h3>
                      <p className="text-3xl font-bold text-primary-600">
                        {results.expirationDate}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700">
                      <span className="font-semibold">Term Basis:</span> {results.termBasis}
                    </p>
                    {!results.isExpired && (
                      <p className="text-gray-700">
                        <span className="font-semibold">Time Remaining:</span>{' '}
                        {results.daysUntilExpiration} days ({results.yearsUntilExpiration} years)
                      </p>
                    )}
                  </div>
                </div>

                {/* Maintenance Fees */}
                {results.maintenanceFees && !results.isExpired && (
                  <div className="card bg-yellow-50 border-2 border-yellow-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-6 h-6 text-yellow-600" />
                      <h3 className="text-xl font-bold text-gray-900">
                        Maintenance Fee Deadlines
                      </h3>
                    </div>
                    <p className="text-sm text-gray-700 mb-4">
                      Maintenance fees must be paid to keep the patent in force. Fees may be paid without surcharge 
                      during the 6-month window before each deadline, or with surcharge during the 6-month grace period after.
                    </p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="font-semibold text-gray-900">First Fee (3.5 years)</span>
                        <span className="text-primary-600 font-medium">
                          {formatDate(results.maintenanceFees.first)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="font-semibold text-gray-900">Second Fee (7.5 years)</span>
                        <span className="text-primary-600 font-medium">
                          {formatDate(results.maintenanceFees.second)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                        <span className="font-semibold text-gray-900">Third Fee (11.5 years)</span>
                        <span className="text-primary-600 font-medium">
                          {formatDate(results.maintenanceFees.third)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Patent Services CTA */}
            <div className="card bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-200">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Need Professional Patent Services?
              </h3>
              <p className="text-sm text-gray-700 mb-4">
                Get expert help with patent prosecution, portfolio management, and IP strategy from experienced professionals.
              </p>
              <div className="space-y-2">
                <a 
                  href="https://patentwerks.ai" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-shadow group"
                >
                  <span className="font-semibold text-primary-600">PatentWerks.ai</span>
                  <ExternalLink className="w-4 h-4 text-primary-600 group-hover:translate-x-1 transition-transform" />
                </a>
                <a 
                  href="https://ipservices.us" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-shadow group"
                >
                  <span className="font-semibold text-primary-600">IP Services</span>
                  <ExternalLink className="w-4 h-4 text-primary-600 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>

            {/* Understanding Patent Terms */}
            <div className="card">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Understanding Patent Terms
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div>
                  <p className="font-semibold text-gray-900">Utility & Plant Patents</p>
                  <p>20 years from the earliest effective filing date (filing date or priority date if claiming domestic benefit)</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Design Patents</p>
                  <p>15 years from grant (if filed on/after May 13, 2015), or 14 years from grant (if filed before)</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Terminal Disclaimers</p>
                  <p>May limit patent term to match another patent, often used to overcome double patenting rejections</p>
                </div>
              </div>
            </div>

            {/* Additional Resources */}
            <div className="card bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Additional Considerations
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 mt-1">•</span>
                  <span>Patent Term Adjustments (PTA) for USPTO delays</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 mt-1">•</span>
                  <span>Patent Term Extensions (PTE) for regulatory review periods</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 mt-1">•</span>
                  <span>Impact of continuation applications on patent family strategy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 mt-1">•</span>
                  <span>Provisional application filing strategies</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Educational Content */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Why Patent Term Matters
            </h3>
            <p className="text-gray-700 mb-3">
              Understanding your patent's expiration date is crucial for IP strategy and business planning. 
              The patent term determines how long you have exclusive rights to prevent others from making, 
              using, or selling your invention.
            </p>
            <p className="text-gray-700">
              Properly managing your patent portfolio requires accurate term calculations to make informed 
              decisions about licensing, enforcement, and R&D investments. Professional{' '}
              <a href="https://patentwerks.ai" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-semibold">
                patent portfolio management
              </a>{' '}
              can help maximize the value of your intellectual property.
            </p>
          </div>

          <div className="card">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Maintenance Fees Are Critical
            </h3>
            <p className="text-gray-700 mb-3">
              For utility and plant patents, missing a maintenance fee deadline will cause your patent to 
              expire prematurely. The USPTO provides a 6-month grace period with surcharges, but planning 
              ahead is essential.
            </p>
            <p className="text-gray-700">
              Many businesses use{' '}
              <a href="https://ipservices.us" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-semibold">
                professional IP services
              </a>{' '}
              to track deadlines and ensure timely payment of maintenance fees across their entire patent portfolio.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-600">
          <p className="mb-2">
            This calculator provides estimates only. For official patent term calculations, consult the USPTO or a registered patent attorney.
          </p>
          <p>
            Professional patent services available at{' '}
            <a href="https://patentwerks.ai" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-semibold">
              PatentWerks.ai
            </a>
            {' '}and{' '}
            <a href="https://ipservices.us" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-semibold">
              IPServices.us
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
